import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findConsultationWithParties } from '../modules/consultations/consultations.repository.js';
import * as messagesRepo from '../modules/messages/messages.repository.js';
import logger from './logger.js';
import { generateAndSaveAiReply } from '../modules/ai-agents/aiChatResponder.service.js';
import { moderateAndCreateMessage, isConsultationLocked } from '../modules/moderation/moderation.service.js'; 
import { autoCompleteIfExpired } from '../modules/consultations/consultations.service.js';
import { isChatLocked, registerMessageAndCheckLimit } from '../utils/chatLimit.util.js';
let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' } // dev ke liye open; production mein specific frontend origin daalna
  });

  // JWT auth — HTTP middleware jaisa hi, connection accept hone se pehle verify
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      if (decoded.stage === 'mfa_pending') return next(new Error('MFA verification incomplete'));
      socket.user = decoded; // { id, role }
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Patient/doctor consultation-specific "room" join karte hain — sirf woh dono is room mein hain
   socket.on('join_consultation', async (consultationId, callback) => {
  try {
    const consultation = await findConsultationWithParties(consultationId);
    if (!consultation) return callback?.({ error: 'Consultation not found' });

    const isPatient = consultation.patient_id === socket.user.id;
    const isDoctor = consultation.doctor_user_id === socket.user.id;
    if (!isPatient && !isDoctor) {
      return callback?.({ error: 'Not authorized for this consultation' });
    }

    // NEW — slot abhi shuru nahi hua
    if (['confirmed', 'in_progress'].includes(consultation.status) && new Date() < new Date(consultation.start_time)) {
      return callback?.({ error: 'This consultation slot has not started yet.' });
    }

    // NEW — lazy auto-complete (agar cron abhi tak nahi chala)
    const current = await autoCompleteIfExpired(consultation);
    if (current.status === 'completed' && consultation.status !== 'completed') {
      io.to(`consultation:${consultationId}`).emit('consultation_completed', {});
    }

    socket.join(`consultation:${consultationId}`);
    callback?.({ success: true });
  } catch (err) {
    logger.error(err, 'join_consultation failed');
    callback?.({ error: 'Something went wrong' });
  }
});

    socket.on('send_message', async ({ consultationId, text }, callback) => {
      try {
        const consultation = await findConsultationWithParties(consultationId);
        if (!consultation) return callback?.({ error: 'Consultation not found' });

        const isPatient = consultation.patient_id === socket.user.id;
        const isDoctor = consultation.doctor_user_id === socket.user.id;
        if (!isPatient && !isDoctor) return callback?.({ error: 'Not authorized' });
        if (!text?.trim()) return callback?.({ error: 'Message cannot be empty' });
   const current = await autoCompleteIfExpired(consultation);
        if (current.status === 'completed') {
          io.to(`consultation:${consultationId}`).emit('consultation_completed', {});
          return callback?.({ error: 'This consultation has ended. You can no longer send messages.' });
        }

        // NEW — agar consultation pehle se locked hai (severe violation review-pending),
        // koi bhi naya message bhejne se roko
        const locked = await isConsultationLocked(consultationId);
        if (locked) {
          return callback?.({ error: 'This chat is temporarily locked pending review.' });
        }

        // NEW — daily AI-token-cost protection: sirf patient→AI-doctor messages pe lagta hai
        // (human-doctor consultations token-cost nahi karti, unko limit se exempt rakha hai)
        if (isPatient && consultation.doctor_kind === 'ai') {
          if (await isChatLocked(socket.user.id)) {
            return callback?.({ error: 'You have reached your daily AI chat limit. Please contact admin to continue.' });
          }
          const { allowed } = await registerMessageAndCheckLimit(socket.user.id);
          if (!allowed) {
            io.to(`consultation:${consultationId}`).emit('chat_locked', {
              reason: 'Daily AI chat limit reached. Please contact admin to unlock.'
            });
            return callback?.({ error: 'You have reached your daily AI chat limit. Please contact admin to continue.' });
          }
        }

        // CHANGED — direct messagesRepo.createMessage() ki jagah moderation wrapper se
        const { message, locked: justLocked } = await moderateAndCreateMessage({
          consultationId,
          senderId: socket.user.id,
          senderKind: isPatient ? 'patient' : 'doctor',
          messageType: 'text',
          content: text.trim()
        });

        io.to(`consultation:${consultationId}`).emit('new_message', message);
        callback?.({ success: true });

        // NEW — agar yeh message hi severe-flag ke saath chat lock kar gaya, sabko batao
        // aur AI-reply trigger mat karo (neeche wala block bhi isse respect karega)
        if (justLocked) {
          io.to(`consultation:${consultationId}`).emit('chat_locked', {
            reason: 'This conversation has been flagged for review and is temporarily read-only.'
          });
          return;
        }

        // NEW — agar AI-doctor consultation hai, patient ke message ke baad AI reply trigger karo.
        // Fire-and-forget (await NAHI kiya) taaki patient ka callback turant resolve ho —
        // Gemini call mein 1-3 second lag sakte hain, patient ko wait nahi karna chahiye.
        // AI ka response jab ready hoga, ek dusra 'new_message' event se aayega — frontend ko
        // koi naya event-type handle nahi karna, existing listener hi kaam karega.
        if (isPatient && consultation.doctor_kind === 'ai') {
          generateAndSaveAiReply({ consultationId, patientMessage: text.trim() })
            .then(({ message: aiMessage, escalation }) => {
              // aiMessage null aa sakta hai agar chat AI-reply ke dauraan hi lock ho gayi thi
              if (aiMessage) {
                io.to(`consultation:${consultationId}`).emit('new_message', aiMessage);
              }

              // NEW — agar escalation-ticket bana hai, patient ko turant ek alag event se
              // inform karo (frontend isse urgent-banner + "Call 108" button dikhayega)
              if (escalation) {
                io.to(`consultation:${consultationId}`).emit('escalation_triggered', escalation);
              }
            })
            .catch((err) => logger.error(err, 'AI reply generation failed'));
        }
      } catch (err) {
        logger.error(err, 'send_message failed');
        callback?.({ error: 'Could not send message' });
      }
    });

    return io;
  });
};

export const getIO = () => io;
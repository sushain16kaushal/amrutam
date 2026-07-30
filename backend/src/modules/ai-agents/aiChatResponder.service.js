import { findAiDoctorContextByConsultationId } from '../consultations/consultations.repository.js';
import * as messagesRepo from '../messages/messages.repository.js';
import { retrieveRelevantChunks } from '../ai-agents/ragRetrieval.service.js';
import { assembleLlmRequest } from '../ai-agents/promptAssembly.service.js';
import { generateAiDoctorResponse } from '../ai-agents/llmClient.service.js';
import { detectEscalation } from '../ai-agents/escalationDetection.service.js';
import { createEscalationTicket } from '../escalation/escalation.repository.js';
import { findNearbyCare } from '../care/nearbyCare.service.js';
import * as usersRepo from '../users/users.repository.js';
import { moderateAndCreateMessage, isConsultationLocked } from '../moderation/moderation.service.js'; // NEW
const mapSenderKindToRole = (senderKind) => (senderKind === 'ai_doctor' ? 'assistant' : 'user');

export const generateAndSaveAiReply = async ({ consultationId, patientMessage }) => {
  // NEW — agar chat pehle se hi severe-content ki wajah se locked hai (pending_review),
  // AI-doctor ko reply generate hi nahi karna chahiye
  const locked = await isConsultationLocked(consultationId);
  if (locked) {
    return { message: null, escalation: null };
  }

  const context = await findAiDoctorContextByConsultationId(consultationId);
  if (!context) {
    throw new Error(`AI-doctor context not found for consultation ${consultationId}`);
  }
  const { specialty, ai_persona_config: personaConfig, doctor_user_id: doctorUserId, patient_id: patientId } = context;

  const rawHistory = await messagesRepo.findByConsultationId(consultationId);
  const chatHistory = rawHistory.slice(0, -1).map((m) => ({
    role: mapSenderKindToRole(m.sender_kind),
    content: m.content
  }));

  const retrievedChunks = await retrieveRelevantChunks({ specialty, message: patientMessage, topK: 3 });

  const llmRequest = assembleLlmRequest({ personaConfig, retrievedChunks, chatHistory, message: patientMessage });
  const responseText = await generateAiDoctorResponse(llmRequest);

  // CHANGED — direct messagesRepo.createMessage() ki jagah ab moderation wrapper se
  // (AI ka apna response bhi classify hota hai — jailbreak/edge-case-persona-drift ke against safety-net)
  const { message: savedMessage } = await moderateAndCreateMessage({
    consultationId,
    senderId: doctorUserId,
    senderKind: 'ai_doctor',
    messageType: 'text',
    content: responseText
  });

  let escalation = null;
  const safetyFlags = personaConfig?.safety_flags || [];

  if (safetyFlags.length > 0) {
    const detection = await detectEscalation({ patientMessage, specialty, safetyFlags });
    if (detection.escalate) {
      // Silent audit-log — dono severities ke liye, koi admin-dashboard-workflow attach nahi
      const ticket = await createEscalationTicket({
        consultationId,
        patientId,
        specialty,
        triggerReason: detection.reason,
        severity: detection.severity
      });

      if (detection.severity === 'urgent') {
        escalation = {
          type: 'emergency',
          ticketId: ticket.id,
          severity: detection.severity,
          reason: detection.reason
        };
      } else {
        let clinics = [];
        try {
          const patientProfile = await usersRepo.findProfileWithUserByUserId(patientId);
          if (patientProfile?.latitude && patientProfile?.longitude) {
            clinics = await findNearbyCare({
              latitude: patientProfile.latitude,
              longitude: patientProfile.longitude
            });
          }
        } catch {
          // nearby-care lookup fail ho jaye toh bhi chat block nahi honi chahiye
        }
        escalation = {
          type: 'nearby_care',
          ticketId: ticket.id,
          severity: detection.severity,
          reason: detection.reason,
          clinics
        };
      }
    }
  }

  return { message: savedMessage, escalation };
};

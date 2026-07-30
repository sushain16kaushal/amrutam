import path from 'path';
import * as messagesService from './messages.service.js';
import { success, error } from '../../utils/apiResponse.js';
import { getIO } from '../../utils/socket.js';

export const getHistory = async (req, res) => {
  try {
    const messages = await messagesService.getHistory(req.user.id, req.params.consultationId);
    success(res, messages);
  } catch (err) { error(res, err); }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) throw { statusCode: 400, message: 'No image file provided' };

    const relativePath = `/uploads/consultation-images/${req.file.filename}`;
    const message = await messagesService.saveImageMessage(req.user.id, req.params.consultationId, relativePath);

    // REST se aayi image bhi turant live chat mein broadcast ho
    getIO()?.to(`consultation:${req.params.consultationId}`).emit('new_message', message);

    success(res, message, 201);
  } catch (err) { error(res, err); }
};

// Image serve karne ke liye authenticated route — public static serving NAHI,
// kyunki symptom photos sensitive health data hain, URL guess karke koi bhi nahi dekh sakta
export const serveImage = async (req, res) => {
  try {
    const { consultationId, filename } = req.params;
    await messagesService.verifyParticipant(req.user.id, consultationId);
    const filePath = path.join(process.cwd(), 'uploads', 'consultation-images', filename);
    res.sendFile(filePath);
  } catch (err) { error(res, err); }
};
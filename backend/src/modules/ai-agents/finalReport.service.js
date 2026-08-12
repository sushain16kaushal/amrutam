import * as messagesRepo from '../messages/messages.repository.js';
import {
  findAiDoctorContextByConsultationId,
  saveHealthReport
} from '../consultations/consultations.repository.js';
import { generateHealthReport } from './healthReport.service.js';
import { findNearbyCare } from '../care/nearbyCare.service.js';
import * as usersRepo from '../users/users.repository.js';

const mapSenderKindToRole = (senderKind) => (senderKind === 'ai_doctor' ? 'assistant' : 'user');

// Consultation kisi bhi tareeke se khatam ho — naturally 'completed', ya user/doctor
// ne 'cancelled', ya system ne auto-complete kiya expiry pe — teeno cases mein yeh
// function call hota hai (dekho consultations.service.js). Poori chat history se
// ek comprehensive health report banata hai aur consultation row pe save karta hai.
export const generateAndSaveFinalReport = async (consultationId) => {
  const rawHistory = await messagesRepo.findByConsultationId(consultationId);

  // Agar patient ne kabhi kuch bola hi nahi (jaise turant cancel kar diya bina
  // chat kiye), report banane ka koi matlab nahi — silently skip karo
  const hasPatientMessage = rawHistory.some((m) => m.sender_kind !== 'ai_doctor');
  if (!hasPatientMessage) {
    return null;
  }

  const context = await findAiDoctorContextByConsultationId(consultationId);
  if (!context) return null;
  const { specialty, patient_id: patientId } = context;

  const chatHistory = rawHistory.map((m) => ({
    role: mapSenderKindToRole(m.sender_kind),
    content: m.content
  }));

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
    // nearby-care lookup fail ho jaye toh bhi report save honi chahiye, bina clinics ke
  }

  let report;
  try {
    report = await generateHealthReport({
      chatHistory,
      specialty,
      matchedFlag: null,
      reason: 'consultation_ended'
    });
  } catch (err) {
    console.error(`Final report generation failed for consultation ${consultationId}:`, err);
    return null;
  }

  return saveHealthReport(consultationId, report, clinics);
};

import { findAiDoctorContextByConsultationId } from '../consultations/consultations.repository.js';
import * as messagesRepo from '../messages/messages.repository.js';
import { retrieveRelevantChunks } from '../ai-agents/ragRetrieval.service.js';
import { assembleLlmRequest } from '../ai-agents/promptAssembly.service.js';
import { generateAiDoctorResponse } from '../ai-agents/llmClient.service.js';
import { detectEscalation } from '../ai-agents/escalationDetection.service.js';
import { createEscalationTicket } from '../escalation/escalation.repository.js';
import { moderateAndCreateMessage, isConsultationLocked } from '../moderation/moderation.service.js';
const mapSenderKindToRole = (senderKind) => (senderKind === 'ai_doctor' ? 'assistant' : 'user');

export const generateAndSaveAiReply = async ({ consultationId, patientMessage }) => {
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

  const { message: savedMessage } = await moderateAndCreateMessage({
    consultationId,
    senderId: doctorUserId,
    senderKind: 'ai_doctor',
    messageType: 'text',
    content: responseText
  });

  // CHANGED — ab sirf 'urgent' severity real-time handle hoti hai. 'Moderate' concept
  // hata diya gaya hai per-message flow se — uska poora context ab consultation-end
  // pe generate hone waali comprehensive health report mein capture hoga
  // (dekho: finalReport.service.js -> generateAndSaveFinalReport).
  let escalation = null;
  const safetyFlags = personaConfig?.safety_flags || [];

  if (safetyFlags.length > 0) {
    const detection = await detectEscalation({ patientMessage, specialty, safetyFlags });
    if (detection.escalate && detection.severity === 'urgent') {
      const ticket = await createEscalationTicket({
        consultationId,
        patientId,
        specialty,
        triggerReason: detection.reason,
        severity: detection.severity
      });

      escalation = {
        type: 'emergency',
        ticketId: ticket.id,
        severity: detection.severity,
        reason: detection.reason
      };
    }
    // 'moderate' (ya koi bhi non-urgent escalate) — jaan-boojh kar yahan kuch nahi karte.
    // Na ticket, na banner. Yeh sab final consultation report mein cover hoga.
  }

  return { message: savedMessage, escalation };
};


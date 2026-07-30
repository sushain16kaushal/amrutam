import { generateStructuredJson } from '../ai-agents/llmClient.service.js';
import * as messagesRepo from '../messages/messages.repository.js';
import * as moderationRepo from './moderation.repository.js';

// ── Keyword pre-filter ──────────────────────────────────────────────────
// Purpose: cheap, instant gate that decides whether a message is even worth
// sending to the LLM classifier (cost-control, per the original design).
// This is NOT the final decision — a keyword hit only triggers the LLM check;
// the LLM's severity/confidence output is what actually creates a case.
//
// IMPORTANT: the "hate_speech" / "sexual_harassment" category lists are left
// empty on purpose — curating an actual slur/harassment-term list is a
// business/legal decision for the team to own and maintain (e.g. in a
// separate reviewed config, possibly sourced from a moderation vendor list),
// not something to hardcode here. Populate KEYWORD_CATEGORIES below with
// your own curated terms before relying on this pre-filter for those categories.
const KEYWORD_CATEGORIES = {
  violent_threat: [
    // Direct kill / murder threats
    'kill you', 'i will kill', "i'll kill", 'i gonna kill', 'im gonna kill',
    'murder you', 'i will murder', "i'll murder", 'slaughter you',
    'end your life', 'take your life', 'finish you', 'finish you off',
    'put you down', 'put a bullet', 'shoot you', 'gun you down',
    'stab you', 'cut your throat', 'slit your throat', 'cut you open',
    'strangle you', 'choke you', 'beat you to death', 'beat you up',
    'bash your head', 'smash your face', 'break your neck', 'snap your neck',
    'come find you', 'i know where you live', 'i will find you', "i'll find you",
    'hunt you down', 'come after you', 'track you down',
    'make you suffer', 'hurt you badly', 'hurt you real bad',
    'destroy you', 'ruin you', 'make you bleed', 'make you pay',
    'you will die', "you'll die", 'you are dead', "you're dead",
    'dead man walking', 'your days are numbered',
    // Bomb / weapon style
    'blow you up', 'bomb you', 'explode you',
    // Physical assault
    'punch you', 'kick your ass', 'kick your face', 'rape and kill',
    'torture you', 'make you scream', 'break every bone',

    // Hindi/Hinglish — extreme threats
    'maar dunga', 'tujhe maar dunga', 'jaan se maar dunga', 'tujhe jaan se maar dunga',
    'tera khoon kar dunga', 'khoon kar dunga tera', 'tujhe khatam kar dunga',
    'zinda nahi chodunga', 'tujhe zinda nahi chodunga', 'goli maar dunga', 'tujhe goli maar dunga',
    'chaku maar dunga', 'chaku ghusa dunga', 'gala kaat dunga', 'tera gala kaat dunga',
    'tujhe dhoond loonga', 'dhoond ke maarunga', 'ghar aake dekh lunga', 'tujhe uthwa lunga',
    'tujhe thok dunga', 'tujhe uda dunga', 'bomb se uda dunga', 'tujhe sabak sikhaunga'
  ],

  self_harm_directed_at_other: [
    // Encouraging / ordering someone else to harm themselves
    'kill yourself', 'kys', 'go kill yourself', 'you should kill yourself',
    'you need to die', 'just die already', 'end it already',
    'slit your wrists', 'cut yourself', 'hang yourself',
    'jump off a bridge', 'jump in front of a train', 'overdose',
    'take all the pills', 'drink bleach', 'swallow bleach',
    'you should hang yourself', 'go hang yourself',
    'nobody would miss you', 'the world is better without you',
    'do us a favor and die', 'put yourself out of misery',
    'go die in a hole', 'go die', 'just go die',
    'commit suicide', 'you should suicide',
    // Medical-context specific (dangerous advice)
    'stop taking your meds', 'stop your medication', 'quit your treatment',
    'dont take the pills', "don't take the medicine",
    'you dont need the doctor', "you don't need treatment",

      // Hindi/Hinglish
    'jaake mar ja', 'mar ja tu', 'tu mar kyun nahi jaata', 'khudkushi kar le',
    'phaansi laga le', 'zeher kha le', 'chal mar ja', 'tujhe koi yaad nahi karega',
    'tu jeene layak nahi hai', 'dawai band kar de', 'ilaaj mat karwa', 'doctor ki zaroorat nahi tujhe'
  ],

  hate_speech: [
    // Racial / ethnic slurs (common ones)
    'nigger', 'nigga', 'chink', 'gook', 'spic', 'wetback', 'beaner',
    'kike', 'heeb', 'raghead', 'towelhead', 'sand nigger',
    'paki', 'curry muncher', 'ape', 'monkey' /* when used racially */,
    // Religious hate
    'jihadist', 'terrorist' /* when used as blanket insult */,
    'christ killer', 'dirty jew', 'muslim terrorist',
    // Homophobic / transphobic
    'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'ladyboy' /* derogatory */,
    'queer' /* when used as insult */, 'homo',
    // Disability / mental health hate (especially relevant in medical context)
    'retard', 'retarded', 'mongoloid', 'cripple', 'spastic',
    'psycho', 'schizo', 'crazy bitch', 'mental case',
    'you belong in a mental asylum', 'lock you up',
    // Gendered hate
    'bitch', 'whore', 'slut', 'cunt' /* when used as pure insult */,
    'feminist cunt', 'male privilege' /* when weaponized as pure hate */,
    // General dehumanizing
    'subhuman', 'vermin', 'cockroach', 'scum', 'piece of shit',
    'you people', 'your kind', 'go back to your country',

        // Hindi/Hinglish — general extreme dehumanizing (caste/communal-specific slurs
    // NOT included — highly region-specific, needs your own/legal curation)
    'kutte ki aulad', 'kamine', 'harami', 'saale kamine', 'nalayak keeda', 'jaanwar hai tu'
  ],

  sexual_harassment: [
    // Explicit sexual demands / comments
    'send nudes', 'show me your tits', 'show me your pussy',
    'i want to fuck you', 'let me fuck you', 'i will fuck you',
    'suck my dick', 'suck my cock', 'deepthroat me',
    'sit on my face', 'ride my cock', 'bend over',
    'i want your body', 'nice ass', 'nice tits', 'big tits',
    'you look fuckable', 'you are so hot', 'i want to bang you',
    // Non-consensual / threatening sexual
    'i will rape you', "i'll rape you", 'rape you',
    'force myself on you', 'take you by force',
    'you will enjoy it', 'you want it',
    // Objectifying / degrading
    'you are just a hole', 'use you like a toy',
    'cum on your face', 'creampie you',
    'make you my slut', 'be my whore',
    // Medical-context inappropriate sexualization
    'examine your body', 'let me check under your clothes',
    'show me where it hurts' /* when sexualized */,
    'touch yourself for me', 'masturbate for me',
    'describe your body', 'what are you wearing',
    // Persistent unwanted advances
    'date me', 'go out with me', 'be my girlfriend',
    'i love you' /* when clearly inappropriate in clinical context */,
    'you are beautiful' /* repeated / unwanted in clinical setting */,
     // Hindi/Hinglish
    'nude bhej', 'nangi photo bhej', 'tujhe chodna hai', 'bistar pe chalte hain',
    'sath sona hai', 'tera jism chahiye', 'kapde utaar', 'randi'
  ]
};

const keywordPreFilter = (text) => {
  const lower = text.toLowerCase();
  for (const [category, terms] of Object.entries(KEYWORD_CATEGORIES)) {
    for (const term of terms) {
      if (term && lower.includes(term)) {
        return category;
      }
    }
  }
  return null;
};

// ── LLM classification ──────────────────────────────────────────────────
const buildModerationPrompt = ({ text, subjectType }) => `
You are a content-safety classifier for a telemedicine chat platform. Classify the
following message sent by a ${subjectType === 'ai_doctor' ? 'an AI doctor persona' : 'a person (patient or doctor)'}.

Message: "${text}"

Classify into one of these severity levels:
- "none" — normal message, no safety concern
- "low" — mildly rude, impatient, or off-topic but not targeted/harmful
- "medium" — inappropriate, harassing, or unprofessional but not an explicit threat/hate/sexual content
- "high" — clear harassment, hate speech, or unprofessional conduct that should be reviewed
- "severe" — explicit threats of violence, hate speech, sexual harassment/explicit content, or similar serious violations

Respond with ONLY valid JSON (no markdown fences, no extra text), in exactly this shape:
{"flagged": true or false, "severity": "none|low|medium|high|severe", "confidence": 0.0 to 1.0, "reason": "short_snake_case_reason"}

"flagged" should be false only for "none" severity. Be conservative — when genuinely
unsure, prefer a lower severity rather than guessing high.
`;

const classifyContent = async ({ text, subjectType }) => {
  try {
    const systemInstruction = 'You are a precise content-safety JSON classifier. Always respond with valid JSON only, no extra text.';
    const prompt = buildModerationPrompt({ text, subjectType });
    const result = await generateStructuredJson({ system: systemInstruction, prompt });

    return {
      flagged: Boolean(result.flagged),
      severity: result.severity || 'none',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0,
      reason: result.reason || null
    };
  } catch (err) {
    console.error('Content moderation classification failed:', err);
    // Fail-open on classifier errors — do not block chat due to an infra hiccup.
    // (If you'd rather fail-closed for safety, flip this to severity: 'medium', flagged: true.)
    return { flagged: false, severity: 'none', confidence: 0, reason: 'classifier_error' };
  }
};

const SEVERE_CONFIDENCE_THRESHOLD = 0.95;

// ── Main entry point — replaces direct messagesRepo.createMessage() calls ──
export const moderateAndCreateMessage = async ({ consultationId, senderId, senderKind, messageType, content }) => {
  const message = await messagesRepo.createMessage({ consultationId, senderId, senderKind, messageType, content });

  // Only text is classified for now — image moderation is a separate, un-designed scope.
  if (messageType !== 'text' || !content?.trim()) {
    return { message, moderationCase: null, locked: false };
  }

  const keywordMatched = keywordPreFilter(content);
  if (!keywordMatched) {
    return { message, moderationCase: null, locked: false };
  }

  const subjectType = senderKind === 'ai_doctor' ? 'ai_doctor' : 'human';
  const classification = await classifyContent({ text: content, subjectType });

  if (!classification.flagged) {
    return { message, moderationCase: null, locked: false };
  }

  const moderationCase = await moderationRepo.createModerationCase({
    consultationId,
    messageId: message.id,
    reportedUserId: senderId,
    subjectType,
    severity: classification.severity,
    confidence: classification.confidence,
    classifierReason: classification.reason,
    keywordMatched
  });

  const isSevereEnough =
    classification.severity === 'severe' && classification.confidence > SEVERE_CONFIDENCE_THRESHOLD;

  if (isSevereEnough) {
    await moderationRepo.setConsultationModerationStatus(consultationId, 'pending_review');
  }

  return { message, moderationCase, locked: isSevereEnough };
};

export const isConsultationLocked = async (consultationId) => {
  const status = await moderationRepo.getConsultationModerationStatus(consultationId);
  return status === 'pending_review';
};

// ── 24hr auto-timeout — hook this into your maintenance worker/queue,
// same pattern as the existing generate-ai-slots job. ──────────────────────
export const autoResolveExpiredCases = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const expiredCases = await moderationRepo.findExpiredPendingCases(cutoff);

  for (const c of expiredCases) {
    await moderationRepo.markCaseUnresolved(c.id);
    await moderationRepo.setConsultationModerationStatus(c.consultation_id, 'normal');
  }

  return { resolvedCount: expiredCases.length };
};
const HUMAN_ACTIONS = ['temp_ban', 'permanent_ban', 'uplift', 'dismissed'];
const AI_DOCTOR_ACTIONS = ['flagged_for_prompt_review', 'dismissed'];
const TEMP_BAN_DEFAULT_DAYS = 7;

export const listPendingCases = async () => {
  return moderationRepo.findPendingCasesWithDetails();
};

export const resolveModerationCase = async (caseId, { action, banDays } = {}) => {
  const moderationCase = await moderationRepo.findCaseById(caseId);
  if (!moderationCase) throw new ApiError(404, 'Case not found');

  const allowedActions = moderationCase.subject_type === 'ai_doctor' ? AI_DOCTOR_ACTIONS : HUMAN_ACTIONS;
  if (!allowedActions.includes(action)) {
    throw new ApiError(400, `Invalid action "${action}" for subject_type "${moderationCase.subject_type}"`);
  }

  const updatedCase = await moderationRepo.resolveCaseWithAction(caseId, action);

  if (action === 'temp_ban') {
    const days = banDays || TEMP_BAN_DEFAULT_DAYS;
    const bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await moderationRepo.setUserBanStatus(moderationCase.reported_user_id, {
      banStatus: 'temp_banned',
      banReason: moderationCase.classifier_reason || 'Content moderation violation',
      bannedUntil
    });
  } else if (action === 'permanent_ban') {
    await moderationRepo.setUserBanStatus(moderationCase.reported_user_id, {
      banStatus: 'permanently_banned',
      banReason: moderationCase.classifier_reason || 'Content moderation violation',
      bannedUntil: null
    });
  }

  // Admin ne review kar liya — consultation-lock hataao (ban khud user-level pe alag-se-enforce hoga login pe)
  await moderationRepo.setConsultationModerationStatus(moderationCase.consultation_id, 'normal');

  return updatedCase;
};
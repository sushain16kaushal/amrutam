import express from 'express';
import * as moderationController from './moderation.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { resolveCaseSchema } from './moderation.validation.js';

const router = express.Router();

router.get('/pending', authenticate, moderationController.listPending);
router.post('/:caseId/resolve', authenticate, validate(resolveCaseSchema), moderationController.resolve);

export default router;
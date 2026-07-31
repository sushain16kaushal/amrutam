import express from 'express';
import * as adminChatController from './adminChat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { unlockChatSchema } from './adminChat.validation.js';

const router = express.Router();

router.post('/unlock-chat/:userId', authenticate, validate(unlockChatSchema), adminChatController.unlock);

export default router;
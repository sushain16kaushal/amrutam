import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = express.Router();

router.post('/register',validate(registerSchema), authController.register);
router.post('/login',validate(loginSchema), authController.login);
router.post('/verify-mfa', authController.verifyMfa);
router.post('/enable-mfa', authenticate, authController.enableMfa); // login hona zaroori hai

export default router;
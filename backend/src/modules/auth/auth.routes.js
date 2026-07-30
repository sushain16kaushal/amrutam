import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema,forgotPasswordSchema,resetPasswordSchema,refreshTokenSchema } from './auth.validation.js';
import { disableMfaSchema } from './auth.validation.js';
import { googleLoginSchema } from './auth.validation.js';
import { disableMfaOtpSchema } from './auth.validation.js';
const router = express.Router();

router.post('/register',validate(registerSchema), authController.register);
router.post('/login',validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/verify-mfa', authController.verifyMfa);
router.post('/enable-mfa', authenticate, authController.enableMfa);
router.post('/disable-mfa/request-otp', authenticate, authController.requestDisableMfaOtp);
router.post('/disable-mfa/verify-otp', authenticate, validate(disableMfaOtpSchema),authController.disableMfaWithOtp);  // login hona zaroori hai
// routes — authLimiter already /api/auth pe lagi hui hai globally, extra kuch nahi chahiye
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/disable-mfa', authenticate, validate(disableMfaSchema), authController.disableMfa);
export default router;
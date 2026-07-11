import express from 'express';
import * as consultController from './consultations.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateStatusSchema } from './consultations.validation.js';
const router = express.Router();

// Ownership check service ke andar ho raha hai, isliye yahan RBAC permission ki zaroorat nahi —
// koi bhi logged-in user hit kar sakta hai, lekin service reject kar dega agar wo consultation ka hissa nahi
router.get('/:id', authenticate, consultController.getOne);
router.post('/:id/cancel', authenticate, consultController.cancel);
router.patch('/:id/status', authenticate, validate(updateStatusSchema), consultController.updateStatus);
export default router;
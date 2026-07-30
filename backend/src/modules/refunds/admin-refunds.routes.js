import express from 'express';
import * as refundsController from './refunds.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rejectRefundSchema } from './refunds.validation.js';

const router = express.Router();

router.get('/mine', authenticate, refundsController.getMine);
router.get('/pending', authenticate, requirePermission('refund:manage'), refundsController.getPending);
router.patch('/:id/approve', authenticate, requirePermission('refund:manage'), refundsController.approve);
router.patch('/:id/reject', authenticate, requirePermission('refund:manage'), validate(rejectRefundSchema), refundsController.reject);

export default router;
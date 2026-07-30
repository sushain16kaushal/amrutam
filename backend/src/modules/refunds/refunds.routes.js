import express from 'express';
import * as refundsController from './refunds.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createRefundSchema } from './refunds.validation.js';

const router = express.Router({ mergeParams: true });

router.post('/', authenticate, validate(createRefundSchema), refundsController.requestRefund);

export default router;
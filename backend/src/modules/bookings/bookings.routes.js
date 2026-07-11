import express from 'express';
import * as bookingsController from './bookings.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { idempotency } from '../../middlewares/idempotency.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { bookSlotSchema } from './bookings.validation.js';
const router = express.Router();

router.post('/', authenticate, requirePermission('booking:create'), idempotency,validate(bookSlotSchema), bookingsController.bookSlot);

export default router;
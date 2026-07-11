import express from 'express';
import * as prescriptionsController from './prescriptions.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createPrescriptionSchema } from './prescriptions.validation.js';
const router = express.Router({ mergeParams: true }); // parent route se :consultationId inherit karne ke liye

router.post('/', authenticate, requirePermission('prescription:create'),validate(createPrescriptionSchema), prescriptionsController.create);
router.get('/', authenticate, prescriptionsController.list); // ownership check service ke andar

export default router;
import express from 'express';
import * as doctorsController from './doctors.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerDoctorSchema, addSlotSchema } from './doctors.validation.js';
const router = express.Router();

router.post('/register', authenticate,validate(registerDoctorSchema) ,doctorsController.registerDoctor);
router.post('/availability', authenticate, requirePermission('availability:create'),validate(addSlotSchema), doctorsController.addSlot);
router.get('/:doctorId/availability', doctorsController.getAvailability); // public — patients search karte hain, login zaroori nahi
router.get('/search', doctorsController.search); // public, jaisa availability route
export default router;
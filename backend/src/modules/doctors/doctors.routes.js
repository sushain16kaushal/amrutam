import express from 'express';
import * as doctorsController from './doctors.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerDoctorSchema, addSlotSchema } from './doctors.validation.js';
import * as reviewsController from '../reviews/reviews.controller.js';
const router = express.Router();

router.post('/register', authenticate,validate(registerDoctorSchema) ,doctorsController.registerDoctor);
router.post('/availability', authenticate, requirePermission('availability:create'),validate(addSlotSchema), doctorsController.addSlot);
router.get('/me', authenticate, doctorsController.getMyProfile);
router.get('/unverified', authenticate, requirePermission('doctor:verify'), doctorsController.listUnverified);
router.get('/:doctorId/availability', doctorsController.getAvailability); // public — patients search karte hain, login zaroori nahi
router.get('/search', doctorsController.search); // public, jaisa availability route
router.get('/specialties', doctorsController.getSpecialties); // public
router.patch('/:doctorId/verify', authenticate, requirePermission('doctor:verify'), doctorsController.verify); 
router.get('/:doctorId', doctorsController.getDoctorById);
router.get('/:doctorId/reviews', reviewsController.getDoctorReviews); // public, baaki public routes ke saath
export default router;
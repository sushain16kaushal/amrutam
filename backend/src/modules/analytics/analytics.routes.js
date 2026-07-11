import express from 'express';
import * as analyticsController from './analytics.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/overview', authenticate, requirePermission('analytics:read'), analyticsController.overview);
router.get('/consultations-by-day', authenticate, requirePermission('analytics:read'), analyticsController.consultationsByDay);
router.get('/top-specialties', authenticate, requirePermission('analytics:read'), analyticsController.topSpecialties);
router.get('/cancellation-rate', authenticate, requirePermission('analytics:read'), analyticsController.cancellationRate);

export default router;
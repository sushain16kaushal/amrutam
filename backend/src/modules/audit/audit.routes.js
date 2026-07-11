import express from 'express';
import * as auditController from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.get('/', authenticate, requirePermission('audit:read'), auditController.list);

export default router;
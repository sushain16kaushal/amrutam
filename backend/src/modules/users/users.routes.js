import express from 'express';
import * as usersController from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './users.validation.js';
const router = express.Router();
router.get('/admin-only-test', authenticate, requirePermission('user:manage'), (req, res) => {
  res.json({ success: true, message: 'You are an admin, RBAC works!' });
});
router.get('/me', authenticate, usersController.getProfile);
router.patch('/me', authenticate,validate(updateProfileSchema), usersController.updateProfile);

export default router;
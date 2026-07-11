// middlewares/rbac.middleware.js
import { ROLE_PERMISSIONS } from '../config/permission.js';
import { ApiError } from '../utils/apiError.js';

export const requirePermission = (permission) => (req, res, next) => {
  const userPermissions = ROLE_PERMISSIONS[req.user?.role] || [];
  if (!userPermissions.includes(permission)) {
    return next(new ApiError(403, 'Forbidden: insufficient permission'));
  }
  next();
};
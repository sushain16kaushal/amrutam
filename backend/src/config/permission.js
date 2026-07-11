// config/permissions.js
export const ROLE_PERMISSIONS = {
  patient: ['booking:create', 'booking:read:own', 'prescription:read:own'],
  doctor: ['availability:create', 'booking:read:assigned', 'prescription:create', 'consultation:update'],
  admin: ['user:manage', 'analytics:read', 'booking:read:all', 'audit:read']
};
import { unlockChat } from '../../utils/chatLimit.util.js';
import { env } from '../../config/env.js';
import { success, error } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export const unlock = async (req, res) => {
  try {
    // Same pattern jaisa baaki admin-only routes mein hai — authenticate() se JWT
    // verify hoti hai, role-check yahan controller mein
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    // PIN = existing ADMIN_PASSWORD — koi naya env var nahi chahiye. Yeh ek extra
    // confirmation-step hai (jaise MFA), admin-auth ka replacement nahi.
    if (req.body.pin !== env.adminPassword) {
      throw new ApiError(401, 'Incorrect PIN');
    }

    await unlockChat(req.params.userId);
    success(res, { unlocked: true, userId: req.params.userId });
  } catch (err) { error(res, err); }
};
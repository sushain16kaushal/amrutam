import * as bookingsService from './bookings.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const bookSlot = async (req, res) => {
  try {
    const consultation = await bookingsService.bookSlot(req.user.id, req.body);
    success(res, consultation, 201);
  } catch (err) { error(res, err); }
};
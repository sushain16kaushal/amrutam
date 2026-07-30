import express from 'express';
import * as reviewsController from './reviews.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createReviewSchema } from './reviews.validation.js';

const router = express.Router({ mergeParams: true });

router.post('/', authenticate, validate(createReviewSchema), reviewsController.submitReview);

export default router;
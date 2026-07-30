import express from 'express';
import * as messagesController from './messages.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = express.Router({ mergeParams: true }); // prescriptions.routes.js jaisa hi pattern

router.get('/', authenticate, messagesController.getHistory);
router.post('/image', authenticate, upload.single('image'), messagesController.uploadImage);
router.get('/image/:filename', authenticate, messagesController.serveImage);

export default router;
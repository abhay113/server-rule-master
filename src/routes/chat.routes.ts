
import express from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateUser } from '../middlewares/auth';

const router = express.Router();

router.post('/ai', authenticateUser, ChatController.handleChatPrompt);

export default router;

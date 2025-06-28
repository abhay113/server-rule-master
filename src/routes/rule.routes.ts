import express from 'express';
import { RuleController } from '../controllers/rule.controller';
import { authenticateUser } from '../middlewares/auth';

const router = express.Router();

router.post('/nlp', authenticateUser, RuleController.createRuleFromPrompt);

export default router;

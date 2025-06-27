import express from 'express';
import { RuleController } from '../controllers/rule.controller';

const router = express.Router();

router.post('/', RuleController.createRuleFromAI);

export default router;

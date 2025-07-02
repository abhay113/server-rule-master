import express from 'express';
import { RuleController } from '../controllers/rule.controller';
import { authenticateUser } from '../middlewares/auth';

const router = express.Router();

// Create rule from NLP prompt
// router.post('/nlp', authenticateUser, RuleController.createRuleFromPrompt);

// CRUD operations
router.post('/', authenticateUser, RuleController.createRule);
router.get('/', authenticateUser, RuleController.getAllRules);
router.get('/:id', authenticateUser, RuleController.getRuleById);
router.put('/:id', authenticateUser, RuleController.updateRule);
router.delete('/:id', authenticateUser, RuleController.deleteRule);

router.get('/stats/rules', authenticateUser, RuleController.getRuleStats);

// Get rules by department
router.get('/department/:department', authenticateUser, RuleController.getRulesByDepartment);

// Toggle rule status
router.patch('/:id/toggle', authenticateUser, RuleController.toggleRuleStatus);

export default router;
import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import validate from '../middlewares/validate';
import { loginSchema , logoutSchema} from '../schemas/auth.schema';

const router = express.Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', validate(logoutSchema), AuthController.logout);

export default router;

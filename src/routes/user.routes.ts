import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import validate from '../middlewares/validate';
import { onboardUserSchema } from '../schemas/onboardUser.schema';

const router = Router();

router.post('/onboard', validate(onboardUserSchema), UserController.onboardUser);
router.get("/", UserController.getAllUsersWithRolesAndGroups)

export default router;

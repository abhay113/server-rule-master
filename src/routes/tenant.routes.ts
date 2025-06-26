import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import validate from '../middlewares/validate';
import { createTenantSchema, updateTenantSchema } from '../schemas/tenant.schema';

const router = Router();

router.get('/', TenantController.getTenants)
router.post('/', validate(createTenantSchema), TenantController.createTenant);
router.patch('/:realm', validate(updateTenantSchema), TenantController.updateTenant);
router.delete('/:realm', TenantController.deleteTenant);


export default router;

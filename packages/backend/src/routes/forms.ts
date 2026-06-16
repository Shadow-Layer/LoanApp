import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { OdkService } from '../services/OdkService';

const router = Router();

router.get('/', authMiddleware, requireRole('loan_officer', 'admin'), async (_req, res, next) => {
  try {
    const forms = await OdkService.listForms();
    res.json(forms);
  } catch (error) {
    next(error);
  }
});

export default router;

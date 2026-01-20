import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/attendance.controller';

const router = Router();

// Temporarily removed auth for testing - TODO: Add back after implementing proper auth
router.get('/today', controller.getTodayAttendance);

export default router;


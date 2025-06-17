import { Router } from 'express';
import {
  createUser,
  loginUser,
  logoutUser,
  userProfile
} from '../../controllers/api/user.controllers.js';
import { auth } from '../../middlewares/auth.middleware.js';

const router = Router();
// api/users/+
router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/profile', auth, userProfile);
router.get('/logout', logoutUser);

export default router;

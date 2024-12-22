import { Router } from 'express';
import {
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from '../controllers/user.controller';
import { authenticateJwt } from '../passport/passport-jwt-strategy';

const router = Router();
const privateRoutes = Router();

// Apply middleware to all private routes
privateRoutes.use(authenticateJwt);

// Public Routes
router.route('/register').post(registerUser);
router.route('/verify-email').post(verifyEmail);
router.route('/login').post(loginUser);

// Private Routes
privateRoutes.route('/logout').post(logoutUser);
privateRoutes.route('/profile').get(getUserProfile);

// merge private route into main route
router.use(privateRoutes);

export default router;

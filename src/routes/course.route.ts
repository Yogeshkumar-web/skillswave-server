import { Router } from 'express';
import { authenticateJwt } from '../passport/passport-jwt-strategy';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getCourses,
  updateCourse,
} from '../controllers/course.controller';

const router = Router();
const privateRoutes = Router();

// Apply middleware to all private routes
privateRoutes.use(authenticateJwt);

// Public Routes
router.route('/courses').get(getCourses);
router.route('/courses/:id').get(getCourse);

// Private Routes
privateRoutes.route('/create-course').post(createCourse);
privateRoutes.route('/update-course/:id').put(updateCourse);
privateRoutes.route('/delete-course/:id').delete(deleteCourse);

// merge private route into main route
router.use(privateRoutes);

export default router;

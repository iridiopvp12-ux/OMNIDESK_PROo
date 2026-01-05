import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.post("/auth/login", AuthController.login);
router.get("/users", AuthController.listUsers);
router.post("/users", AuthController.createUser);
router.delete("/users/:id", AuthController.deleteUser);
router.get("/departments", AuthController.listDepartments);
router.post("/departments", AuthController.createDepartment);
router.delete("/departments/:id", AuthController.deleteDepartment);

export { router as authRoutes };

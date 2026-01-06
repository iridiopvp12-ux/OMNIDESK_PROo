import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();

router.get("/whatsapp", SettingsController.getWhatsappStatus);
router.post("/whatsapp/logout", SettingsController.logoutWhatsapp);

export { router as settingsRoutes };

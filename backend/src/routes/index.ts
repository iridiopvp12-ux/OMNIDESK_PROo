import { Router } from 'express';
import { ticketRoutes } from './ticket.routes';
import { contactRoutes } from './contact.routes';
import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { settingsRoutes } from './settings.routes';
import { upload } from '../services/upload';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public: Auth (Login) & Webhooks (future)
router.use("/", authRoutes);

// Protected Routes
router.use("/tickets", authMiddleware, ticketRoutes);
router.use("/dashboard", authMiddleware, dashboardRoutes);
router.use("/settings", authMiddleware, settingsRoutes);
router.use("/contacts", authMiddleware, contactRoutes);
router.use("/", authMiddleware, contactRoutes); // Messages endpoints

// Upload Protected
router.post("/upload", authMiddleware, upload.single('file'), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename, mimetype: req.file.mimetype });
});

export { router };

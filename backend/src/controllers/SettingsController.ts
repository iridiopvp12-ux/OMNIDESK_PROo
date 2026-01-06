import { Request, Response } from 'express';
import { getStatus, logout, startWhatsApp } from '../services/whatsapp';

export class SettingsController {
    static async getWhatsappStatus(req: Request, res: Response) {
        res.json(getStatus());
    }

    static async logoutWhatsapp(req: Request, res: Response) {
        await logout();
        startWhatsApp();
        res.json({ success: true });
    }
}

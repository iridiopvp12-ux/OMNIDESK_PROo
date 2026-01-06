import { Request, Response } from 'express';
import { getStatus, logout, startWhatsApp, resetSession } from '../services/whatsapp';

export class SettingsController {
    static async getWhatsappStatus(req: Request, res: Response) {
        res.json(getStatus());
    }

    static async logoutWhatsapp(req: Request, res: Response) {
        await logout();
        res.json({ success: true });
    }

    static async resetWhatsapp(req: Request, res: Response) {
        await resetSession();
        res.json({ success: true });
    }
}

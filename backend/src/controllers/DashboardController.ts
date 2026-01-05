import { Request, Response } from 'express';
import { prisma } from '../services/prisma';

export class DashboardController {
    static async getStats(req: Request, res: Response) {
        try {
            const totalTickets = await prisma.ticket.count();
            const openTickets = await prisma.ticket.count({ where: { status: { not: 'done' } } });
            const doneTickets = await prisma.ticket.count({ where: { status: 'done' } });
            const totalContacts = await prisma.contact.count();

            res.json({
                total: totalTickets,
                open: openTickets,
                done: doneTickets,
                contacts: totalContacts
            });
        } catch (e) {
            res.status(500).json({ error: "Erro ao buscar estatísticas" });
        }
    }

    static async searchTickets(req: Request, res: Response) {
        const { q } = req.query; // termo de busca
        if (!q || typeof q !== 'string') return res.json([]);

        try {
            const tickets = await prisma.ticket.findMany({
                where: {
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { contact: { name: { contains: q, mode: 'insensitive' } } },
                        { id: { contains: q } } // Busca por ID também
                    ]
                },
                include: { contact: true, department: true, assignedTo: true },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json(tickets);
        } catch (e) {
            res.status(500).json({ error: "Erro na busca" });
        }
    }
}

import { Request, Response } from 'express';
import { prisma } from '../services/prisma';

export class TicketController {
    // Listar Tickets (Kanban)
    static async index(req: Request, res: Response) {
        try {
            // Busca TODOS que não são 'done'
            const activeTickets = await prisma.ticket.findMany({
                where: { status: { not: 'done' } },
                include: { contact: true, department: true, assignedTo: true },
                orderBy: { createdAt: 'desc' }
            });

            // Busca os últimos 10 'done' para não poluir
            const doneTickets = await prisma.ticket.findMany({
                where: { status: 'done' },
                take: 10,
                include: { contact: true, department: true, assignedTo: true },
                orderBy: { updatedAt: 'desc' }
            });

            res.json([...activeTickets, ...doneTickets]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Erro ao buscar tickets" });
        }
    }

    // Assumir Ticket
    static async assign(req: Request, res: Response) {
        const { userId } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const ticket = await prisma.ticket.update({
                where: { id: req.params.ticketId },
                data: {
                    assignedToId: userId,
                    status: 'doing',
                    departmentId: user?.departmentId
                }
            });
            res.json(ticket);
        } catch (e) {
            res.status(500).json({ error: "Erro ao assumir ticket" });
        }
    }

    // Encerrar Ticket
    static async close(req: Request, res: Response) {
        const { closingNote } = req.body;
        try {
            const ticket = await prisma.ticket.update({
                where: { id: req.params.ticketId },
                data: {
                    status: 'done',
                    closingNote: closingNote,
                    assignedToId: null
                }
            });
            res.json(ticket);
        } catch (e) {
            res.status(500).json({ error: "Erro ao encerrar ticket" });
        }
    }

    // Transferir Ticket
    static async transfer(req: Request, res: Response) {
        const { departmentId } = req.body;
        try {
            await prisma.ticket.update({
                where: { id: req.params.ticketId },
                data: {
                    departmentId,
                    status: 'todo',
                    assignedToId: null
                }
            });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: "Erro ao transferir" });
        }
    }

    // Atualização Genérica
    static async update(req: Request, res: Response) {
        try {
            const ticket = await prisma.ticket.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(ticket);
        } catch (e) {
            res.status(500).json({ error: "Erro ao atualizar ticket" });
        }
    }
}

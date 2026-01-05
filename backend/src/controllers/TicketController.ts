import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { getIO } from '../services/socket';

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
            getIO().emit("ticket:update", ticket);
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
            getIO().emit("ticket:update", ticket);
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
            getIO().emit("ticket:update", { id: req.params.ticketId });
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
            getIO().emit("ticket:update", ticket);
            res.json(ticket);
        } catch (e) {
            res.status(500).json({ error: "Erro ao atualizar ticket" });
        }
    }

    // Deletar Ticket
    static async delete(req: Request, res: Response) {
        try {
            await prisma.ticket.delete({ where: { id: req.params.id } });
            getIO().emit("ticket:update", { id: req.params.id, deleted: true });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: "Erro ao excluir ticket" });
        }
    }
}

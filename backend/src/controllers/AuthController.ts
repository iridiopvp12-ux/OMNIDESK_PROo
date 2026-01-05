import { Request, Response } from 'express';
import { prisma } from '../services/prisma';

export class AuthController {
    static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        // MVP: Se for o login mestre hardcoded (fallback)
        if (email === 'admin' && password === 'admin') {
             // Tenta achar ou cria um admin padrão no banco para garantir ID válido
             let admin = await prisma.user.findUnique({ where: { email: 'admin@omnidesk.com' }});
             if (!admin) {
                 admin = await prisma.user.create({
                     data: {
                         name: "Administrador",
                         email: "admin@omnidesk.com",
                         password: "admin",
                         role: "ADMIN"
                    }
                 });
             }
             return res.json({ user: admin });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || user.password !== password) {
                return res.status(401).json({ error: "Credenciais inválidas" });
            }
            res.json({ user });
        } catch (e) {
            res.status(500).json({ error: "Erro no login" });
        }
    }

    static async listUsers(req: Request, res: Response) {
        const users = await prisma.user.findMany({ include: { department: true } });
        res.json(users);
    }

    static async createUser(req: Request, res: Response) {
        const { name, email, password, role, departmentId } = req.body;
        try {
            const user = await prisma.user.create({
                data: { name, email, password, role, departmentId }
            });
            res.json(user);
        } catch (e) { res.status(500).json({ error: "Erro ao criar usuário" }); }
    }

    static async listDepartments(req: Request, res: Response) {
        const depts = await prisma.department.findMany();
        res.json(depts);
    }

    static async createDepartment(req: Request, res: Response) {
        try {
            const dept = await prisma.department.create({ data: { name: req.body.name } });
            res.json(dept);
        } catch (e) { res.status(500).json({ error: "Erro ao criar setor" }); }
    }

    static async deleteUser(req: Request, res: Response) {
        try {
            // Desvincula tickets antes de excluir
            await prisma.ticket.updateMany({
                where: { assignedToId: req.params.id },
                data: { assignedToId: null, status: 'todo' } // Volta pra fila
            });

            await prisma.user.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao excluir usuário" }); }
    }

    static async deleteDepartment(req: Request, res: Response) {
        try {
            // Desvincula usuários e tickets
            await prisma.user.updateMany({
                where: { departmentId: req.params.id },
                data: { departmentId: null }
            });
            await prisma.ticket.updateMany({
                where: { departmentId: req.params.id },
                data: { departmentId: null }
            });

            await prisma.department.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao excluir setor" }); }
    }
}

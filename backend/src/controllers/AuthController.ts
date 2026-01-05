import { Request, Response } from 'express';
import { prisma } from '../services/prisma';

export class AuthController {
    static async login(req: Request, res: Response) {
        // Login Mock para o MVP
        res.json({
            user: {
                id: "admin-master",
                name: "Administrador",
                role: "ADMIN",
                departmentId: null
            }
        });
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
}

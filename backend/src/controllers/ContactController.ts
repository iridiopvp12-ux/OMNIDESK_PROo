import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { getSocket } from '../services/whatsapp';
import { getIO } from '../services/socket';
import path from 'path';

export class ContactController {
    static async index(req: Request, res: Response) {
        try {
            const contacts = await prisma.contact.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    messages: { take: 1, orderBy: { createdAt: 'desc' } },
                    tickets: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        include: { department: true }
                    }
                }
            });
            res.json(contacts);
        } catch (e) { res.status(500).json({ error: "Erro ao buscar contatos" }); }
    }

    static async delete(req: Request, res: Response) {
        try {
            await prisma.contact.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao excluir" }); }
    }

    static async update(req: Request, res: Response) {
        try {
            await prisma.contact.update({
                where: { id: req.params.id },
                data: { name: req.body.name }
            });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao atualizar Contato" }); }
    }

    static async toggleAi(req: Request, res: Response) {
        try {
            await prisma.contact.update({
                where: { id: req.params.id },
                data: { isAiActive: req.body.isAiActive }
            });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao atualizar IA" }); }
    }

    static async getMessages(req: Request, res: Response) {
        try {
            const messages = await prisma.message.findMany({
                where: { contactId: req.params.contactId },
                orderBy: { createdAt: 'asc' }
            });
            res.json(messages);
        } catch (e) { res.status(500).json({ error: "Erro ao buscar mensagens" }); }
    }

    static async updateMessage(req: Request, res: Response) {
        const { content } = req.body;
        try {
            const msg = await prisma.message.update({
                where: { id: Number(req.params.id) },
                data: { content }
            });
            res.json(msg);
        } catch (e) { res.status(500).json({ error: "Erro ao editar mensagem" }); }
    }

    static async deleteMessage(req: Request, res: Response) {
        try {
            await prisma.message.delete({ where: { id: Number(req.params.id) } });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: "Erro ao excluir mensagem" }); }
    }

    static async sendMessage(req: Request, res: Response) {
        const { contactId, text, mediaUrl, mediaType } = req.body;
        const socket = getSocket();

        if (!socket) return res.status(503).json({ error: "WhatsApp desconectado" });

        try {
            let newMessage;
            if (mediaUrl && mediaType) {
                const filePath = path.join(process.cwd(), 'uploads', path.basename(mediaUrl));
                let messageContent: any = {};

                if (mediaType === 'image') {
                    messageContent = { image: { url: filePath }, caption: text };
                } else if (mediaType === 'audio') {
                    messageContent = { audio: { url: filePath }, ptt: true };
                } else {
                    messageContent = { document: { url: filePath }, mimetype: 'application/octet-stream', fileName: text || 'Arquivo' };
                }

                await socket.sendMessage(contactId, messageContent);

                 newMessage = await prisma.message.create({
                    data: {
                        contactId,
                        content: text || (mediaType === 'audio' ? 'Áudio enviado' : 'Arquivo enviado'),
                        fromMe: true,
                        isAi: false,
                        mediaType: mediaType,
                        mediaUrl: mediaUrl
                    }
                });

            } else {
                await socket.sendMessage(contactId, { text });
                newMessage = await prisma.message.create({
                    data: {
                        contactId,
                        content: text,
                        fromMe: true,
                        isAi: false,
                        mediaType: 'text'
                    }
                });
            }
            getIO().emit("message:new", { contactId, message: newMessage });
            res.json({ success: true });
        } catch (error) {
            console.error("Erro envio:", error);
            res.status(500).json({ error: "Falha no envio" });
        }
    }

    static async sendTyping(req: Request, res: Response) {
        const { contactId } = req.body;
        const socket = getSocket();
        if (socket) {
            await socket.sendPresenceUpdate('composing', contactId);
            setTimeout(() => socket.sendPresenceUpdate('paused', contactId), 3000);
            res.json({ success: true });
        } else {
            res.status(503).json({ error: "Desconectado" });
        }
    }
}

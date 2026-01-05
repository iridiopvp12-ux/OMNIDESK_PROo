import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // Import necessário para caminhos de pasta
import { startWhatsApp, getSocket } from "./services/whatsapp"; 
import { prisma } from "./services/prisma"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 0. CONFIGURAÇÃO DE MÍDIA (CRÍTICO) ---
// Libera a pasta 'uploads' para que o site possa mostrar as fotos e áudios
// O navegador vai acessar tipo: http://localhost:3001/uploads/nome-do-arquivo.jpg
app.use('/uploads', express.static('uploads'));

// --- 1. ROTAS DE TICKETS (FLUXO DE TRABALHO) ---

// Listar Tickets (Kanban)
app.get("/api/tickets", async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: { 
                contact: true, 
                department: true,
                assignedTo: true 
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao buscar tickets" });
    }
});

// ASSUMIR TICKET (Triagem -> Em Atendimento)
app.post("/api/tickets/:ticketId/assign", async (req, res) => {
    const { userId } = req.body;
    try {
        // Busca o usuário para saber o setor dele
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        const ticket = await prisma.ticket.update({
            where: { id: req.params.ticketId },
            data: { 
                assignedToId: userId,
                status: 'doing', // <--- FORÇA O STATUS PARA "EM ATENDIMENTO"
                departmentId: user?.departmentId // Ticket herda o setor do funcionário
            }
        });
        res.json(ticket);
    } catch (e) {
        res.status(500).json({ error: "Erro ao assumir ticket" });
    }
});

// ENCERRAR TICKET
app.post("/api/tickets/:ticketId/close", async (req, res) => {
    const { closingNote } = req.body;
    try {
        const ticket = await prisma.ticket.update({
            where: { id: req.params.ticketId },
            data: { 
                status: 'done', // Finalizado
                closingNote: closingNote,
                assignedToId: null // Libera o "dono" para histórico
            }
        });
        res.json(ticket);
    } catch (e) {
        res.status(500).json({ error: "Erro ao encerrar ticket" });
    }
});

// TRANSFERIR TICKET
app.post("/api/tickets/:ticketId/transfer", async (req, res) => {
    const { departmentId } = req.body;
    try {
        await prisma.ticket.update({
            where: { id: req.params.ticketId },
            data: { 
                departmentId, 
                status: 'todo', // Volta para a fila de "A Fazer" do novo setor
                assignedToId: null 
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao transferir" });
    }
});

// --- 2. ROTAS DE GESTÃO DE EQUIPE (ADMIN) ---

app.get("/api/departments", async (req, res) => {
    const depts = await prisma.department.findMany();
    res.json(depts);
});

app.post("/api/departments", async (req, res) => {
    try {
        const dept = await prisma.department.create({ data: { name: req.body.name } });
        res.json(dept);
    } catch (e) { res.status(500).json({ error: "Erro ao criar setor" }); }
});

app.get("/api/users", async (req, res) => {
    const users = await prisma.user.findMany({ include: { department: true } });
    res.json(users);
});

app.post("/api/users", async (req, res) => {
    const { name, email, password, role, departmentId } = req.body;
    try {
        const user = await prisma.user.create({
            data: { name, email, password, role, departmentId }
        });
        res.json(user);
    } catch (e) { res.status(500).json({ error: "Erro ao criar usuário" }); }
});

// --- 3. ROTAS DE CONTATOS E MENSAGENS ---

app.get("/api/contacts", async (req, res) => {
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
});

app.delete("/api/contacts/:id", async (req, res) => {
    try {
        await prisma.contact.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao excluir" }); }
});

app.get("/api/messages/:contactId", async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { contactId: req.params.contactId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (e) { res.status(500).json({ error: "Erro ao buscar mensagens" }); }
});

app.post("/api/contacts/:id/toggle-ai", async (req, res) => {
    try {
        await prisma.contact.update({
            where: { id: req.params.id },
            data: { isAiActive: req.body.isAiActive }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao atualizar IA" }); }
});

// --- 4. ENVIO DE MENSAGENS E LOGIN ---

app.post("/api/send", async (req, res) => {
    const { contactId, text } = req.body;
    const socket = getSocket();

    if (!socket) return res.status(503).json({ error: "WhatsApp desconectado" });

    try {
        // Envia mensagem de texto via Socket
        await socket.sendMessage(contactId, { text });
        
        // Salva no banco
        await prisma.message.create({
            data: { 
                contactId, 
                content: text, 
                fromMe: true, 
                isAi: false,
                mediaType: 'text' // Garante que é texto
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Erro envio:", error);
        res.status(500).json({ error: "Falha no envio" });
    }
});

app.post("/api/auth/login", (req, res) => {
    // Login Mock para o MVP
    res.json({ 
        user: { 
            id: "admin-master", 
            name: "Administrador", 
            role: "ADMIN",
            departmentId: null 
        } 
    });
});

// --- INICIALIZAÇÃO ---

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🛡️ API ONLINE: http://localhost:${PORT}`);
  console.log(`📁 Pasta de Uploads: http://localhost:${PORT}/uploads`);
  
  try {
    await startWhatsApp();
  } catch (error) {
    console.error("Erro fatal no WhatsApp:", error);
  }
});
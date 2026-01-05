import { Router } from 'express';
import { ticketRoutes } from './ticket.routes';
import { contactRoutes } from './contact.routes';
import { authRoutes } from './auth.routes';
import { upload } from '../services/upload';

const router = Router();

// Configuração de Rotas
router.use("/tickets", ticketRoutes);
// A rota de contatos mistura /contacts e /messages e /send, vamos ajustar no server.ts ou aqui?
// Melhor: no contactRoutes, definimos a base. Mas como as rotas são mistas no controller original...
// Vamos reorganizar:
// /api/contacts -> contactRoutes (que tem delete, put, toggleAi)
// /api/messages -> precisa de rota própria? No original era /api/messages/:contactId
// /api/send -> era solto.

// Solução Prática: Manter a estrutura de URL original para não quebrar frontend.
// Auth Routes lida com /api/users, /api/departments, /api/auth/login.
// Então:
router.use("/", authRoutes);

// Ticket Routes: /api/tickets
router.use("/tickets", ticketRoutes);

// Contact Routes: /api/contacts (base)
// Mas temos GET /api/messages/:contactId e POST /api/send que não começam com /contacts.
// Vamos importar essas rotas soltas.
router.use("/contacts", contactRoutes);

// Rotas "Soltas" de Mensagem (que estavam em contact.routes mas precisam de base correta)
// Precisamos refatorar contact.routes para exportar corretamente ou montar aqui.
// Vamos simplificar: contactRoutes exporta um Router. Se montarmos em /contacts, fica /api/contacts/messages/:id (errado).
// Vamos criar routers separados ou montar na raiz.
router.use("/", contactRoutes); // Isso monta /messages, /send, etc. na raiz /api/

// Upload
router.post("/upload", upload.single('file'), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename, mimetype: req.file.mimetype });
});

export { router };

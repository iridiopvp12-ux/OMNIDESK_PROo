import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';

const router = Router();

// Contatos
router.get("/", ContactController.index);
router.delete("/:id", ContactController.delete);
router.put("/:id", ContactController.update);
router.post("/:id/toggle-ai", ContactController.toggleAi);

// Mensagens
router.get("/messages/:contactId", ContactController.getMessages);
router.put("/messages/:id", ContactController.updateMessage);
router.delete("/messages/:id", ContactController.deleteMessage);
router.post("/send", ContactController.sendMessage);
router.post("/typing", ContactController.sendTyping);

export { router as contactRoutes };

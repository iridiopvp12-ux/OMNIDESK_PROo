import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';

const router = Router();

router.get("/", TicketController.index);
router.post("/:ticketId/assign", TicketController.assign);
router.post("/:ticketId/close", TicketController.close);
router.post("/:ticketId/transfer", TicketController.transfer);
router.put("/:id", TicketController.update);

export { router as ticketRoutes };

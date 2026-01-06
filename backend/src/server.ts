import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { startWhatsApp } from "./services/whatsapp";
import { router } from "./routes";
import { initIO } from "./services/socket";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// Segurança e Otimização
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate Limiting (Proteção DDoS básica)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000 // limite de requisições por IP
});
app.use("/api", limiter);

// --- 0. CONFIGURAÇÃO DE MÍDIA ---
// Usa path.resolve para garantir o caminho correto independente de onde o script é rodado
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- 1. ROTAS API ---
app.use("/api", router);

// --- INICIALIZAÇÃO (HTTP + SOCKET) ---
const server = http.createServer(app);
initIO(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🛡️ API ONLINE: http://localhost:${PORT}`);
  console.log(`📁 Pasta de Uploads: ${uploadsPath}`);
  
  try {
    await startWhatsApp();
  } catch (error) {
    console.error("Erro fatal no WhatsApp:", error);
  }
});

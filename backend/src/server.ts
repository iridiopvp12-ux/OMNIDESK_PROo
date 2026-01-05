import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { startWhatsApp } from "./services/whatsapp";
import { router } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- 0. CONFIGURAÇÃO DE MÍDIA ---
// Usa path.resolve para garantir o caminho correto independente de onde o script é rodado
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// --- 1. ROTAS API ---
app.use("/api", router);

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🛡️ API ONLINE: http://localhost:${PORT}`);
  console.log(`📁 Pasta de Uploads: ${uploadsPath}`);
  
  try {
    await startWhatsApp();
  } catch (error) {
    console.error("Erro fatal no WhatsApp:", error);
  }
});

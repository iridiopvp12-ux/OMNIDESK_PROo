import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs"; 
import mime from "mime-types"; 

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error("❌ GEMINI_API_KEY ausente no .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- CONFIGURAÇÃO: GEMINI 2.0 FLASH ---
// O modelo 2.0 é nativamente multimodal e muito rápido.
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp", 
    generationConfig: {
        temperature: 0.2, // Mantém a precisão para seguir o JSON
        maxOutputTokens: 2000,
    }
});

// Memória Volátil (RAM)
const memory = new Map<string, string>();

const SYSTEM_PROMPT = `
IDENTIDADE: Você é a JÚLIA, a triadora especialista e acolhedora do escritório previdenciário do Dr. José Lucas.

🧠 DIRETRIZES DE INTELIGÊNCIA:
1. INTERPRETAÇÃO ROBUSTA: O cliente pode usar gírias ou português informal. Entenda a intenção.
2. EMPATIA: Seja cordial e profissional.
3. MULTIMODALIDADE (IMPORTANTE):
   - Se receber ÁUDIO: Ouça com atenção, entenda o problema relatado e responda como se fosse texto.
   - Se receber IMAGEM (DOCUMENTO): Confirme o recebimento ("Recebi a foto do documento") e extraia informações se necessário.

🚀 FLUXO DE ATENDIMENTO:
1. ACOLHIMENTO: Entenda o problema principal.
2. INVESTIGAÇÃO: Faça UMA pergunta por vez (Idade, Tempo de contribuição, Motivo do indeferimento).
3. ENCERRAMENTO: Quando tiver o mínimo para o advogado analisar.

🔴 GERAÇÃO DE RELATÓRIO E TICKET (CRÍTICO):
Quando você decidir encerrar o atendimento para passar ao humano, diga sua frase de despedida e, IMEDIATAMENTE DEPOIS, gere um bloco JSON oculto EXATAMENTE assim (sem formatação markdown):

[REPORT_START]
{
  "cliente": "Nome Identificado",
  "tema": "LOAS / Aposentadoria / Auxílio / Outros",
  "interpretacao": "Resumo técnico do caso (incluindo transcrição mental de áudios se houver).",
  "atencao": "Pontos de urgência ou perfil do cliente",
  "sugestao": "Agendar Consulta / Pedir CNIS / Análise",
  "prioridade": "medium"
}
[REPORT_END]

⚠️ REGRA FINAL: Não adicione \`\`\`json ou blocos de código. Apenas as tags [REPORT_START] e [REPORT_END].
`;

// Função auxiliar: Converte arquivo local para o formato do Google Gemini
async function fileToGenerativePart(path: string, mimeType: string) {
    const fileData = await fs.promises.readFile(path);
    return {
      inlineData: {
        data: fileData.toString("base64"),
        mimeType,
      },
    };
}

// Função Principal: Gera resposta considerando Texto + Histórico + Mídia (Opcional)
export const gerarResposta = async (msgUsuario: string, contactId: string, mediaPath?: string): Promise<string> => {
    try {
        // 1. Recupera histórico
        let historico = memory.get(contactId) || "";
        
        // 2. Monta o Prompt (Array de conteúdos)
        const promptParts: any[] = [
            SYSTEM_PROMPT,
            "\n\n--- HISTÓRICO RECENTE ---\n",
            historico,
            `\n\nCliente (Mensagem Atual): "${msgUsuario || '[Arquivo de Mídia enviado]'}"\n`
        ];

        // 3. Se tiver arquivo (Áudio/Imagem), anexa ao prompt
        if (mediaPath) {
            const mimeType = mime.lookup(mediaPath) || 'application/octet-stream';
            const mediaPart = await fileToGenerativePart(mediaPath, mimeType);
            
            promptParts.push(mediaPart);
            promptParts.push("\n(O cliente enviou o arquivo acima. Analise o conteúdo dele junto com o texto.)\n");
        }

        promptParts.push("\nJúlia:");
        
        // 4. Envia para o Gemini
        const result = await model.generateContent(promptParts);
        const respostaFull = result.response.text();

        // 5. Salva no histórico (removendo o JSON técnico para economizar tokens e não confundir)
        const textoLimpo = respostaFull.replace(/\[REPORT_START\][\s\S]*?\[REPORT_END\]/, "").trim();
        historico += `\nCliente: "${msgUsuario || '[Mídia]'}"\nJúlia: "${textoLimpo}"`;

        // Gestão de memória (Janela deslizante)
        if (historico.length > 10000) {
            const corte = historico.length - 8000;
            historico = "..." + historico.substring(corte);
        }
        
        memory.set(contactId, historico);

        // Retorna a resposta completa (com JSON) para o whatsapp.ts processar
        return respostaFull;

    } catch (error: any) {
        console.error("❌ Erro AI Multimodal:", error.message);
        return "Desculpe, o sistema está processando muitas informações. Pode repetir a última mensagem ou enviar em texto? 🙏";
    }
};



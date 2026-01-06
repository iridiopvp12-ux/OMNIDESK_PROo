import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { prisma } from './prisma'; 
import { gerarResposta } from './ai';
import qrcode from 'qrcode-terminal';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { getIO } from './socket';

let sock: any; 
let qrCode: string | null = null;
let connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

export const getSocket = () => sock;
export const getStatus = () => ({ status: connectionStatus, qr: qrCode });

export const logout = async () => {
    try {
        await sock?.logout();
        qrCode = null;
        connectionStatus = 'disconnected';
        getIO().emit('whatsapp:status', { status: 'disconnected' });
    } catch (e) { console.error("Erro logout", e); }
};

export const resetSession = async () => {
    try {
        console.log("🔄 Resetando sessão WhatsApp...");

        // Force close socket if open to release file handles
        try {
            if (sock && sock.ws) {
                sock.ws.close();
            } else {
                await logout();
            }
        } catch (err) {
            console.warn("Aviso: Erro ao fechar socket:", err);
        }

        sock = undefined;
        qrCode = null;
        connectionStatus = 'disconnected';

        // Pequeno delay para garantir liberação de arquivos
        await new Promise(resolve => setTimeout(resolve, 2000));

        const authPath = path.resolve('./auth_info_baileys');
        if (await fs.stat(authPath).catch(() => false)) {
            await fs.rm(authPath, { recursive: true, force: true });
            console.log("🗑️ Pasta de autenticação removida com sucesso.");
        }

        startWhatsApp();
    } catch (e) { console.error("Erro ao resetar sessão:", e); }
};

export const startWhatsApp = async () => {
    console.log("🚀 Iniciando serviço WhatsApp...");
    const authPath = path.resolve('./auth_info_baileys');
    const hasSession = await fs.stat(authPath).catch(() => false);

    if (hasSession) {
        console.log("📂 Sessão encontrada. Tentando restaurar conexão...");
    } else {
        console.log("🆕 Nenhuma sessão encontrada. Aguardando geração de QR Code...");
    }

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        defaultQueryTimeoutMs: undefined,
        browser: ["OmniDesk Pro", "Chrome", "2.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        console.log("🔄 Connection Update:", JSON.stringify({ connection, qr: qr ? "QR_RECEIVED" : "NO_QR", status: connectionStatus }));
        
        if (qr) { 
            qrCode = qr;
            connectionStatus = 'connecting';
            console.log("📲 Novo QR Code gerado");
            qrcode.generate(qr, { small: true });
            getIO().emit('whatsapp:qr', qr);
            getIO().emit('whatsapp:status', { status: 'connecting' });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            connectionStatus = 'disconnected';
            qrCode = null;
            getIO().emit('whatsapp:status', { status: 'disconnected' });

            console.log('❌ Conexão caiu. Reconectando...', shouldReconnect);

            if (shouldReconnect) {
                startWhatsApp();
            } else {
                console.log('📴 Conexão encerrada definitivamente (Logout ou Banimento). Resetando para novo QR Code...');
                resetSession();
            }
        } else if (connection === 'open') {
            connectionStatus = 'connected';
            qrCode = null;
            getIO().emit('whatsapp:status', { status: 'connected' });
            console.log('✅ WhatsApp Conectado com Sucesso!');
        }
    });

    // --- PROCESSAMENTO DE MENSAGENS ---
    // --- PRESENCE & STATUS EVENTS ---
    sock.ev.on('presence.update', (data: any) => {
        if (data.presences) {
            Object.keys(data.presences).forEach(remoteJid => {
                const presence = data.presences[remoteJid];
                if (presence.lastKnownPresence === 'composing') {
                    getIO().emit('chat:typing', { contactId: remoteJid });
                }
            });
        }
    });

    sock.ev.on('messages.update', (updates: any) => {
        for (const update of updates) {
            getIO().emit('message:status', {
                id: update.key.id,
                status: update.update.status // 3=sent, 4=delivered, 5=read
            });
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const contactId = msg.key.remoteJid; 

            // 1. Identificar o tipo de mensagem
            const messageType = Object.keys(msg.message)[0];
            let content = "";
            let mediaUrl = null;
            let mediaTypeDb = "text";
            let localFilePath = null;

            try {
                // Caso seja texto puro
                if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                    content = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                } 
                // Caso seja Mídia (Imagem, Áudio, Documento)
                else if (['imageMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
                    
                    if (messageType === 'imageMessage') mediaTypeDb = 'image';
                    else if (messageType === 'audioMessage') mediaTypeDb = 'audio';
                    else mediaTypeDb = 'document';

                    // Download do buffer
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage });
                    
                    // Descobre extensão
                    const mimeType = msg.message[messageType]?.mimetype || "";
                    const extension = mime.extension(mimeType) || "bin";
                    
                    // Gera nome único: timestamp + final do numero + extensão
                    const fileName = `${Date.now()}_${contactId.slice(-4)}.${extension}`;
                    
                    // Caminho Absoluto (onde salva) e Relativo (link pro front)
                    localFilePath = path.join(__dirname, '../../uploads', fileName);
                    mediaUrl = `/uploads/${fileName}`;

                    // Salva no disco
                    await fs.writeFile(localFilePath, buffer);

                    // Legenda ou texto padrão
                    content = msg.message[messageType]?.caption || `[Arquivo: ${mediaTypeDb}]`;
                    
                    console.log(`📁 Mídia salva: ${fileName}`);
                } else {
                    // Ignora stickers, contatos, etc.
                    continue; 
                }
            } catch (erroDownload) {
                console.error("Erro ao baixar mídia:", erroDownload);
                content = "[Erro ao baixar arquivo]";
            }

            // 2. Garante que contato existe
            const contact = await prisma.contact.upsert({
                where: { id: contactId },
                update: {},
                create: { id: contactId, name: msg.pushName || "Cliente Novo", isAiActive: true }
            });

            // 3. Salva mensagem no banco
            await prisma.message.create({
                data: {
                    contactId,
                    content,
                    fromMe: false,
                    mediaType: mediaTypeDb,
                    mediaUrl: mediaUrl // Pode ser null se for texto
                }
            });

            // 4. IA Processa (com suporte a arquivo se houver)
            if (contact.isAiActive) {
                await sock.sendPresenceUpdate('composing', contactId);
                
                // Envia texto + caminho do arquivo local para a IA ler
                const respostaFull = await gerarResposta(content, contactId, localFilePath || undefined);
                
                // Extração do Relatório Oculto
                const regexReport = /\[REPORT_START\]([\s\S]*?)\[REPORT_END\]/;
                const match = respostaFull.match(regexReport);
                let textoFinal = respostaFull;

                if (match) {
                    try {
                        const jsonStr = match[1];
                        const reportData = JSON.parse(jsonStr);
                        
                        // Cria ticket automaticamente
                        await prisma.ticket.create({
                            data: {
                                contactId,
                                title: reportData.tema || "Triagem Finalizada",
                                priority: reportData.prioridade || "medium",
                                status: "todo",
                                summary: reportData 
                            }
                        });
                        
                        // Remove o JSON da resposta pro cliente
                        textoFinal = respostaFull.replace(regexReport, "").trim();
                    } catch (err) {
                        console.error("Erro JSON IA:", err);
                        textoFinal = respostaFull.replace(/\[REPORT_START\][\s\S]*?\[REPORT_END\]/, "").trim();
                    }
                }

                // Envia resposta limpa
                if (textoFinal) {
                    await sock.sendMessage(contactId, { text: textoFinal });
                    
                    await prisma.message.create({
                        data: {
                            contactId,
                            content: textoFinal,
                            fromMe: true,
                            isAi: true,
                            mediaType: 'text'
                        }
                    });
                }
            }
        }
    });
};
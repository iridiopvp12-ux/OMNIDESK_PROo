# Guia de Deploy - OmniDesk Pro

Este guia descreve como implantar a aplicação em um servidor de produção (VM com 16GB RAM).

## 1. Requisitos
- VM Ubuntu 20.04/22.04
- Docker e Docker Compose instalados.
- Domínio configurado (opcional, para SSL).

## 2. Instalação Rápida (Docker Compose)

A melhor opção para sua VM de 16GB é usar **Docker Compose**. Ele isola o ambiente, gerencia o banco de dados e reinicia serviços automaticamente se falharem.

1. **Clone o repositório na VM:**
   ```bash
   git clone <SEU_REPO> app
   cd app
   ```

2. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz (baseado no `backend/.env`):
   ```env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=senha_segura
   POSTGRES_DB=omnidesk
   DATABASE_URL="postgresql://user:senha_segura@db:5432/omnidesk"
   JWT_SECRET="segredo_muito_complexo_aqui"
   GEMINI_API_KEY="sua_chave_aqui"
   PORT=3001
   ```

3. **Suba os Containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Verifique:**
   - Frontend: `http://SEU_IP`
   - Backend: `http://SEU_IP:3001`

## 3. Segurança e Otimização (Aplicadas)
- **Rate Limiting:** Proteção contra DDoS configurada no backend (1000 req/15min).
- **Helmet:** Headers de segurança HTTP ativados.
- **Compression:** Gzip ativado para respostas mais rápidas.
- **Reinício Automático:** Configurado no Docker (`restart: always`).

## 4. Alternativa (Bare Metal + PM2)
Se preferir não usar Docker para o Node.js:
1. Instale Node v20 e Postgres na VM.
2. No backend: `npm install && npm run build`.
3. Use o arquivo `ecosystem.config.js` gerado:
   ```bash
   npm install -g pm2
   pm2 start backend/ecosystem.config.js
   pm2 save
   pm2 startup
   ```

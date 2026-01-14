import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.resolve(__dirname, '../../.env');
const examplePath = path.resolve(__dirname, '../../.env.example');

console.log('🚀 Iniciando configuração do ambiente...');

// 1. Criar .env se não existir
if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
        console.log('✅ Arquivo .env criado a partir de .env.example');
    } else {
        console.error('❌ .env.example não encontrado!');
        process.exit(1);
    }
} else {
    console.log('ℹ️ Arquivo .env já existe.');
}

try {
    // 2. Sincronizar banco de dados
    console.log('📦 Sincronizando banco de dados...');
    execSync('npx prisma db push', { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });
    console.log('✅ Banco de dados sincronizado!');

    // 3. Criar usuário Admin
    console.log('👤 Verificando usuário Admin...');
    execSync('npx ts-node src/scripts/init_admin.ts', { stdio: 'inherit', cwd: path.resolve(__dirname, '../..') });

    console.log('\n✨ Configuração concluída com sucesso!');
    console.log('Agora você pode rodar: npm run dev');
} catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    process.exit(1);
}

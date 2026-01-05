import dotenv from "dotenv";
dotenv.config();

async function check() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("❌ ERRO: Sem chave no .env");
        return;
    }
    console.log(`🔑 Testando chave: ...${key.slice(-6)}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const res = await fetch(url);
        // AQUI ESTÁ A CORREÇÃO: Adicionei ": any" para o TypeScript não reclamar
        const data: any = await res.json();

        if (data.error) {
            console.error("\n❌ ERRO DO GOOGLE:", data.error.message);
            console.log("👉 SOLUÇÃO: Você precisa ativar a API no Google Cloud ou verificar o faturamento.");
        } else if (data.models) {
            console.log("\n✅ SUCESSO! Modelos liberados para sua conta:");
            // Filtra e mostra só os modelos Gemini
            const models = data.models.filter((m: any) => m.name.includes('gemini'));
            models.forEach((m: any) => console.log(`   * ${m.name.replace('models/', '')}`));
            
            console.log("\n👉 Mande essa lista para mim!");
        } else {
            console.log("⚠️ Resposta estranha do Google:", data);
        }
    } catch (e) {
        console.error("Erro de conexão:", e);
    }
}

check();
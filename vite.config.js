import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "autoUpdate" registra o SW automaticamente e atualiza em background.
      // O app continua funcionando enquanto a nova versão baixa.
      registerType: "autoUpdate",

      // Garante que o SW seja gerado mesmo em desenvolvimento (útil pra testar).
      devOptions: {
        enabled: false,
      },

      // Arquivos que o SW vai pré-cachear no momento da instalação.
      // Isso garante que o app abre mesmo sem internet na primeira vez após instalar.
      includeAssets: [
        "icon-192.png",
        "icon-512.png",
        "compras.svg",
        "condominio.svg",
        "conta.svg",
        "eventos.svg",
        "festa.svg",
        "saude.svg",
      ],

      // Configuração do manifesto — mantém o que você já tem no manifest.json
      // mas deixa o plugin gerenciar pra garantir consistência com o SW.
      manifest: false, // false = usa o manifest.json que já existe em /public

      workbox: {
        // Estratégia: tenta a rede primeiro, cai no cache se offline.
        // Ideal pra apps que precisam de dados frescos mas devem funcionar offline.
        runtimeCaching: [
          {
            // Arquivos do próprio app (JS, CSS, HTML)
            urlPattern: ({ request }) =>
              request.destination === "document" ||
              request.destination === "script" ||
              request.destination === "style",
            handler: "NetworkFirst",
            options: {
              cacheName: "tnl-app-shell",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
          {
            // Imagens e ícones
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "tnl-assets",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 dias
              },
            },
          },
          {
            // Chamadas à API do Supabase — tenta rede, usa cache se offline.
            // O usuário vê os dados da última sessão quando não tem internet.
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "tnl-supabase",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
              networkTimeoutSeconds: 5, // após 5s sem resposta, usa cache
            },
          },
          {
            // API Anthropic (IA) — só tenta rede, sem cache (dados sensíveis).
            urlPattern: ({ url }) =>
              url.hostname.includes("anthropic.com") ||
              url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
        ],

        // Garante que o SW tome controle imediatamente após instalação,
        // sem precisar fechar e reabrir o app.
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
});

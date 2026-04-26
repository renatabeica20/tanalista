import { useState, useRef, useCallback, useEffect } from "react";

// ── API Anthropic integrada ────────────────────────────────────────────────
// Observação: em produção, o ideal é chamar a Anthropic por um backend/proxy.
// Em app Vite/React, variáveis VITE_* ficam expostas no navegador.
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_MODEL_CLASSIFY = import.meta.env.VITE_ANTHROPIC_MODEL_CLASSIFY || "claude-3-5-haiku-latest";
const ANTHROPIC_MODEL_ORGANIZE = import.meta.env.VITE_ANTHROPIC_MODEL_ORGANIZE || "claude-3-5-sonnet-latest";

// ── Supabase: listas compartilháveis ──────────────────────────────────────
// Usa a REST API do Supabase diretamente para evitar dependência adicional.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function createSharedListRecord(list) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.");
  }

  const payload = {
    title: list?.name || "Lista de compras",
    list_type: list?.type || "geral",
    budget: Number(list?.budget || 0),
    data: list,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro ao salvar lista compartilhada (${res.status}) ${text}`.trim());
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function getSharedListRecord(id) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "GET",
    headers: supabaseHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro ao abrir lista compartilhada (${res.status}) ${text}`.trim());
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

function extractJsonObject(text) {
  const raw = String(text || "").trim().replace(/```json|```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON não encontrado na resposta da IA");
  return JSON.parse(match[0]);
}

async function callAnthropicJSON({ prompt, system, maxTokens = 800, model }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Chave da Anthropic não configurada em VITE_ANTHROPIC_KEY");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Erro Anthropic HTTP ${res.status}${errorText ? ` - ${errorText.slice(0, 160)}` : ""}`);
  }

  const data = await res.json();
  const text = data?.content?.find?.((c) => c.type === "text")?.text || data?.content?.[0]?.text || "";
  return extractJsonObject(text);
}

async function classifyProduct(name) {
  const prompt = [
    "Você é especialista em supermercados brasileiros, como Atacadão, Carrefour e Assaí.",
    "Classifique o produto para lista de compras: " + name,
    "",
    "Retorne APENAS JSON válido, sem markdown:",
    '{"marcas":["Marca1","Marca2"],"tipos":["Tipo1","Tipo2"],"pesos":["500g","1kg"],"volumes":["500ml","1L"],"unidades":["unidade","pacote","kg"]}',
    "",
    "Regras:",
    "- marcas: 4 a 8 marcas brasileiras comuns;",
    "- tipos: 3 a 7 variações comuns;",
    "- pesos: tamanhos em g/kg se for sólido, senão [];",
    "- volumes: tamanhos em ml/L se for líquido, senão [];",
    "- unidades: formas de contagem, como pacote, kg, fardo, lata, garrafa e unidade.",
  ].join("\n");

  const p = await callAnthropicJSON({
    prompt,
    model: ANTHROPIC_MODEL_CLASSIFY,
    maxTokens: 600,
  });

  return {
    marcas: Array.isArray(p.marcas) ? p.marcas : [],
    tipos: Array.isArray(p.tipos) ? p.tipos : [],
    pesos: Array.isArray(p.pesos) ? p.pesos : [],
    volumes: Array.isArray(p.volumes) ? p.volumes : [],
    unidades: Array.isArray(p.unidades) && p.unidades.length ? p.unidades : ["unidade", "pacote", "kg"],
  };
}


// ── PALETA DE CORES POR CATEGORIA ─────────────────────────────────────────
// Cores alinhadas às categorias do Atacadão (atacadao.com.br)
const CAT_THEME = {
  // ── ALIMENTAÇÃO ──────────────────────────────────────────────────
  "Hortifruti":              { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"🥬" },
  "Carnes e Aves":           { bg:"#FCE4EC", border:"#C62828", header:"#B71C1C", icon:"🥩" },
  "Frios e Laticínios":      { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"🧀" },
  "Frios e Embutidos":       { bg:"#E8EAF6", border:"#4527A0", header:"#311B92", icon:"🍖" },
  "Laticínios":              { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"🥛" },
  "Mercearia":               { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🛒" },
  "Congelados":              { bg:"#E0F2F1", border:"#00695C", header:"#004D40", icon:"🧊" },
  // ── PADARIA E MATINAIS ───────────────────────────────────────────
  "Padaria e Matinais":      { bg:"#FFF8E1", border:"#E65100", header:"#BF360C", icon:"🍞" },
  "Padaria e Cereais":       { bg:"#FFF8E1", border:"#E65100", header:"#BF360C", icon:"🍞" },
  "Cafés e Chás":            { bg:"#EFEBE9", border:"#4E342E", header:"#3E2723", icon:"☕" },
  // ── BEBIDAS ──────────────────────────────────────────────────────
  "Bebidas":                 { bg:"#E1F5FE", border:"#0277BD", header:"#01579B", icon:"🥤" },
  "Cervejas":                { bg:"#FFF8E1", border:"#F57F17", header:"#E65100", icon:"🍺" },
  "Bebidas Alcoólicas":      { bg:"#FFF8E1", border:"#F57F17", header:"#E65100", icon:"🍺" },
  "Vinhos e Destilados":     { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🍷" },
  // ── LIMPEZA ──────────────────────────────────────────────────────
  "Limpeza":                 { bg:"#E1F5FE", border:"#0277BD", header:"#01579B", icon:"🧹" },
  // ── HIGIENE ──────────────────────────────────────────────────────
  "Higiene e Perfumaria":    { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🪥" },
  "Higiene e Beleza":        { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🪥" },
  "Bebês":                   { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"👶" },
  // ── DESCARTÁVEIS ─────────────────────────────────────────────────
  "Descartáveis e Embalagens":{ bg:"#ECEFF1", border:"#455A64", header:"#263238", icon:"🥡" },
  "Descartáveis":            { bg:"#ECEFF1", border:"#455A64", header:"#263238", icon:"🥡" },
  // ── SNACKS ───────────────────────────────────────────────────────
  "Snacks e Doces":          { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍫" },
  "Snacks":                  { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍪" },
  "Chocolates e Doces":      { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍫" },
  // ── TEMPEROS ─────────────────────────────────────────────────────
  "Temperos e Condimentos":  { bg:"#FFF3E0", border:"#E65100", header:"#BF360C", icon:"🧂" },
  "Temperos":                { bg:"#FFF3E0", border:"#E65100", header:"#BF360C", icon:"🧂" },
  // ── CONSTRUÇÃO / ELÉTRICO ────────────────────────────────────────
  "Hidráulica":              { bg:"#E0F7FA", border:"#006064", header:"#004D40", icon:"🚿" },
  "Elétrica":                { bg:"#FFFDE7", border:"#F57F17", header:"#E65100", icon:"⚡" },
  "Ferragens":               { bg:"#EFEBE9", border:"#3E2723", header:"#1B0000", icon:"🔩" },
  "Ferramentas":             { bg:"#F5F5F5", border:"#424242", header:"#212121", icon:"🔧" },
  "Iluminação":              { bg:"#FFFDE7", border:"#F9A825", header:"#F57F17", icon:"💡" },
  "Acabamento":              { bg:"#EDE7F6", border:"#4527A0", header:"#311B92", icon:"🖌️" },
  // ── OUTROS ───────────────────────────────────────────────────────
  "Medicamentos":            { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"💊" },
  "Jardim":                  { bg:"#F1F8E9", border:"#558B2F", header:"#33691E", icon:"🌿" },
  "Cadernos":                { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"📓" },
  "Material de Escrita":     { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"✏️" },
  "Arte":                    { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🎨" },
  "Utilidades Domésticas":   { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🏠" },
  "Itens Extras":            { bg:"#FFF3E0", border:"#E64A19", header:"#BF360C", icon:"⭐" },
  "Outros":                  { bg:"#FAFAFA", border:"#757575", header:"#424242", icon:"📦" },
};

function getCatTheme(name) {
  return CAT_THEME[name] || { bg:"#FAFAFA", border:"#BDBDBD", header:"#424242", icon:"📦" };
}

const LIST_TYPES = [
  {id:"mercado",   label:"🛒 Supermercado"},
  {id:"festa",     label:"🎉 Festa/Churrasco"},
  {id:"construcao",label:"🏗️ Construção"},
  {id:"eletrico",  label:"⚡ Elétrico"},
  {id:"escolar",   label:"🏫 Escolar"},
  {id:"farmacia",  label:"💊 Farmácia"},
  {id:"condominio",label:"🏢 Condomínio"},
  {id:"outros",    label:"📦 Outros"},
];

const TYPE_NAMES = {
  mercado:"supermercado", festa:"festa/churrasco", construcao:"construção",
  eletrico:"material elétrico", escolar:"material escolar",
  farmacia:"farmácia", condominio:"condomínio", outros:"geral",
};


// ══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO COMPLETA DE PRODUTOS — BASEADA NO ATACADÃO (atacadao.com.br)
// ══════════════════════════════════════════════════════════════════════════
// Departamentos: Mercearia · Bebidas · Cervejas · Cafés/Chás/Achocolatados
// Padaria e Matinais · Limpeza · Higiene e Perfumaria · Bebês
// Frios e Laticínios · Carnes e Aves · Hortifrúti · Congelados
// Descartáveis e Embalagens · Utilidades Domésticas
//
// Cada entrada: { marcas[], tipos[], pesos[], volumes[], unidades[] }
// marcas  = principais marcas do Atacadão para o produto
// tipos   = variações / sabores / versões do produto
// pesos   = tamanhos em gramas/kg (produtos sólidos — embalagem pacote/saco/lata)
// volumes = tamanhos em ml/L (produtos líquidos — garrafa/frasco/caixinha)
// unidades= como o produto é contado na compra
function getProductConfig(name) {
  const n = name.toLowerCase().trim();

  // ════════════════════════════════════════════════════
  // MERCEARIA — Grãos e Cereais
  // ════════════════════════════════════════════════════

  if (/\barroz\b/.test(n))
    return {
      marcas:["Tio João","Camil","Prato Fino","Namorado","Urbano","Broto Legal"],
      tipos:["Branco Tipo 1 (Agulhinha)","Integral","Parboilizado","Parboilizado Integral","Arbóreo (risoto)"],
      pesos:["1kg","2kg","5kg","10kg"],
      unidades:["pacote","saco","fardo 10kg"]
    };

  if (/\bfeijão\b/.test(n))
    return {
      marcas:["Camil","Tio João","Kicaldo","Leco","Broto Legal"],
      tipos:["Carioca Tipo 1","Preto Tipo 1","Branco","Fradinho","Jalo","Bolinha"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","saco"]
    };

  if (/macarrão|massa/.test(n))
    return {
      marcas:["Renata","Divella","Barilla","De Cecco","Santa Amália","Petybon"],
      tipos:["Espaguete","Parafuso","Penne","Talharim","Fusilli","Lasanha","Ave-maria","Farfalle","Conchiglie"],
      pesos:["500g","1kg"],
      unidades:["pacote","caixa"]
    };

  if (/\baçúcar\b/.test(n))
    return {
      marcas:["União","Da Barra","Guarani","Refinações de Milho","Dobradinha"],
      tipos:["Refinado","Cristal","Demerara","Mascavo","Light","Confeiteiro"],
      pesos:["1kg","2kg","5kg"],
      unidades:["pacote","saco","fardo 10kg"]
    };

  if (/farinha de trigo|farinha trigo/.test(n))
    return {
      marcas:["Renata","Dona Benta","Anaconda","Orquídea","Santa Amália"],
      tipos:["Tradicional","Integral","Com fermento","Sem fermento","Especial"],
      pesos:["1kg","2kg","5kg"],
      unidades:["pacote","saco"]
    };

  if (/\bfarinha\b/.test(n))
    return {
      marcas:["Yoki","Kimura","Broto Legal","Camil"],
      tipos:["Trigo","Mandioca crua","Mandioca torrada","Milho","Fubá","Rosca","Tempero"],
      pesos:["500g","1kg","2kg","5kg"],
      unidades:["pacote","saco"]
    };

  if (/\bsal\b(?! de frutas| grosso para churrasco)/.test(n))
    return {
      marcas:["Cisne","Lebre","Mariner","Salina","Refinosal"],
      tipos:["Refinado iodado","Grosso","Marinho","Light (cloreto de potássio)"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","caixa"]
    };

  if (/\bazeite\b/.test(n))
    return {
      marcas:["Gallo","Andorinha","Carbonell","Borges","La Española","Coppini","Português","Tipo Único"],
      tipos:["Extra virgem","Virgem","Composto","Tempero (alho/ervas)"],
      volumes:["250ml","500ml","750ml","1L"],
      unidades:["garrafa","lata","unidade"]
    };

  if (/\bóleo\b/.test(n))
    return {
      marcas:["Soya","Liza","Salada","Vivo","Cocinero","Bunge Pro"],
      tipos:["Soja","Girassol","Canola","Milho","Algodão","Composto"],
      volumes:["500ml","900ml","1,5L","2L"],
      unidades:["garrafa","unidade","fardo 6"]
    };

  if (/\bvinagre\b/.test(n))
    return {
      marcas:["Heinz","Castelo","Minhoto","Real","Companhia das Ervas"],
      tipos:["Álcool","Maçã","Vinho branco","Vinho tinto","Balsâmico"],
      volumes:["500ml","750ml","1L"],
      unidades:["garrafa","unidade","fardo 12"]
    };

  if (/maionese/.test(n))
    return {
      marcas:["Hellmann's","Heinz","Quero","Sura","Mosteiro","Arisco"],
      tipos:["Tradicional","Light","Azeite","Temperada","Zero"],
      pesos:["200g","250g","390g","500g","1kg"],
      unidades:["pote","sachê","unidade","balde"]
    };

  if (/ketchup/.test(n))
    return {
      marcas:["Heinz","Quero","Hellmann's","Arisco","Hunt's"],
      tipos:["Tradicional","Picante","Light","Zero"],
      pesos:["200g","300g","390g","1kg"],
      unidades:["pote","sachê","unidade"]
    };

  if (/mostarda/.test(n))
    return {
      marcas:["Hellmann's","Heinz","Quero","Arisco","L'ancienne"],
      tipos:["Tradicional","Dijon","Grainy","Mel","Picante"],
      pesos:["200g","250g","380g"],
      unidades:["pote","sachê","unidade"]
    };

  if (/molho de tomate|extrato de tomate|polpa de tomate/.test(n))
    return {
      marcas:["Quero","Pomarola","Heinz","Peixe","Fugini","Cica","Carrefour"],
      tipos:["Molho tradicional","Molho temperado","Molho com manjericão","Molho com azeitona","Extrato","Polpa","Pelado"],
      pesos:["190g","200g","300g","340g","520g","1kg"],
      unidades:["caixinha","lata","sachê","unidade"]
    };

  if (/\batum\b/.test(n))
    return {
      marcas:["Gomes da Costa","Coqueiro","Italmar","Pescador","Frescatto","Rio de Una"],
      tipos:["Em água","Em óleo","Com limão","Light","Defumado","Pedaço","Sólido"],
      pesos:["170g","300g"],
      unidades:["lata","caixa 3","caixa 12","unidade"]
    };

  if (/\bsardinha\b/.test(n))
    return {
      marcas:["Gomes da Costa","Coqueiro","Bom Porto","Real","Frutos do Mar"],
      tipos:["Em óleo","Em molho de tomate","Defumada","Temperada","Com limão"],
      pesos:["125g","250g"],
      unidades:["lata","caixa 3","caixa 12","unidade"]
    };

  if (/milho verde|milho em lata/.test(n))
    return {
      marcas:["Quero","Bonduelle","Predilecta","Fugini","Cica","Green Giant"],
      tipos:["Em conserva","Cremoso","Orgânico"],
      pesos:["170g","200g","300g"],
      unidades:["lata","caixa 12","unidade"]
    };

  if (/ervilha/.test(n))
    return {
      marcas:["Quero","Bonduelle","Predilecta","Fugini","Cica"],
      tipos:["Em conserva","Partida seca","Extra-fina"],
      pesos:["170g","200g","300g"],
      unidades:["lata","caixa 12","unidade"]
    };

  if (/\baveia\b/.test(n))
    return {
      marcas:["Quaker","Yoki","Native","Jasmine","Dr. Oetker"],
      tipos:["Flocos finos","Flocos grossos","Farelo","Em grão","Crunch"],
      pesos:["250g","500g","1kg"],
      unidades:["pacote","lata","caixa"]
    };

  if (/linhaça|chia|quinoa|gergelim|amaranto/.test(n))
    return {
      marcas:["Yoki","Native","Jasmine","Vitalin","Foods","Sítio Capuava"],
      tipos:["Dourada","Marrom","Triturada","Orgânica"],
      pesos:["200g","500g","1kg"],
      unidades:["pacote"]
    };

  if (/\bfubá\b|\bpolenta\b/.test(n))
    return {
      marcas:["Yoki","Kimura","Broto Legal","Camil","Canguru"],
      tipos:["Mimoso","Grosso","Creme de milho","Pré-cozido","Temperado"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","saco"]
    };

  if (/tempero|caldo knorr|maggi|sazon|arisco/.test(n))
    return {
      marcas:["Knorr","Maggi","Sazon","Arisco","Fondor","Ajinomoto"],
      tipos:["Caldo de carne","Caldo de frango","Caldo de legumes","Tempero baiano","Alho e sal","Completo","Colorau"],
      pesos:["50g","57g","100g","200g","300g"],
      unidades:["caixa","pacote","unidade","tubo"]
    };

  if (/\bcolorau\b|\bpáprica\b/.test(n))
    return {
      marcas:["Arisco","Kitano","Yoki","Alimba"],
      tipos:["Colorau","Páprica doce","Páprica picante","Páprica defumada"],
      pesos:["60g","100g","200g"],
      unidades:["unidade","pacote"]
    };

  if (/doce de leite/.test(n))
    return {
      marcas:["Italac","Quatá","Mococa","Leite Moça","Aviação"],
      tipos:["Cremoso","Em tablete","Light"],
      pesos:["200g","400g","500g","1kg"],
      unidades:["pote","lata","unidade"]
    };

  if (/leite condensado/.test(n))
    return {
      marcas:["Moça","Piracanjuba","Italac","Ninho","Elegê"],
      tipos:["Tradicional","Light","Zero lactose"],
      pesos:["395g","397g"],
      unidades:["lata","caixinha","unidade","fardo 12"]
    };

  if (/creme de leite/.test(n))
    return {
      marcas:["Nestlé","Parmalat","Italac","Quatá","Elegê","Vigor"],
      tipos:["Caixinha","Lata","Fresco UHT","Culinário"],
      pesos:["200g","300g"],
      unidades:["caixinha","lata","unidade","fardo 12"]
    };

  if (/biscoito|bolacha/.test(n))
    return {
      marcas:["Oreo","Recheio","Trakinas","Wafer Bauducco","Cream Cracker Nestlé","Maria Nestlé","Maizena","Triunfo","Marilan","Adria"],
      tipos:["Recheado chocolate","Recheado morango","Recheado baunilha","Cream cracker","Água e sal","Maria","Maizena","Integral","Wafer","Amanteigado","Rosquinha"],
      pesos:["100g","130g","200g","300g","375g","400g","500g"],
      unidades:["pacote","caixa","fardo"]
    };

  if (/cereal matinal|granola|sucrilhos|corn flakes/.test(n))
    return {
      marcas:["Kellogg's","Nestlé","Quaker","Native","Jasmine","Nutri Free"],
      tipos:["Corn Flakes","Sucrilhos","Granola com mel","Granola com frutas","Aveia granola","Musli","Integral"],
      pesos:["200g","250g","300g","500g","1kg"],
      unidades:["caixa","pacote","lata"]
    };

  if (/chocolate em pó|achocolatado em pó|nescau|toddy|milo/.test(n))
    return {
      marcas:["Nescau","Toddy","Milo","Ovomaltine","Forno de Minas","Cacau Show"],
      tipos:["Tradicional","50% cacau","Zero açúcar","Diet","Com vitaminas"],
      pesos:["200g","400g","800g","1kg"],
      unidades:["lata","pacote","caixa"]
    };

  if (/\bchocolate\b/.test(n))
    return {
      marcas:["Nestlé","Lacta","Harald","Garoto","Hershey's","Cacau Show","Lindt","Melken"],
      tipos:["Ao leite","Meio amargo","Branco","70% cacau","Com castanhas","Com amendoim","Trufado"],
      pesos:["25g","80g","90g","150g","200g","400g"],
      unidades:["unidade","tablete","caixa","pacote"]
    };

  if (/salgadinho|batata chips|doritos|ruffles|fandangos|cheetos/.test(n))
    return {
      marcas:["Elma Chips","Doritos","Ruffles","Cheetos","Fandangos","Lays","Pringles","Torcida"],
      tipos:["Batata original","Batata cheddar","Milho","Trigo","Amendoim crocante","Mix de salgados"],
      pesos:["45g","55g","100g","120g","167g","200g","300g"],
      unidades:["pacote","lata","caixa"]
    };

  if (/\bpipoca\b/.test(n))
    return {
      marcas:["Yoki","Pop Weaver","Cinépolis","Sinhá"],
      tipos:["Manteiga","Sal","Caramelo","Natural","Micro-ondas","Canjiquinha"],
      pesos:["50g","100g","200g","400g"],
      unidades:["pacote","caixa"]
    };

  // ════════════════════════════════════════════════════
  // CAFÉS, CHÁS E ACHOCOLATADOS
  // ════════════════════════════════════════════════════

  if (/\bcafé\b/.test(n))
    return {
      marcas:["Pilão","Melitta","3 Corações","Café do Ponto","Nespresso","Nescafé","Illy","Santa Clara","Dois Frades","Pelé"],
      tipos:["Torrado e moído tradicional","Extra forte","Suave","Gourmet premium","Solúvel","Cápsulas Nespresso","Cápsulas Dolce Gusto","Cappuccino","Filtro de papel"],
      pesos:["250g","500g","1kg"],
      unidades:["pacote","lata","caixa","cápsula 10un","cápsula 50un"]
    };

  if (/\bchá\b/.test(n))
    return {
      marcas:["Leão","Matte Leão","Lipton","Camomila Fazendinha","Twinings","Dr. Oetker"],
      tipos:["Verde","Preto","Camomila","Erva-doce","Hortelã","Hibisco","Mate","Cidreira","Boldo","Misto frutas"],
      pesos:["10 sachês","15 sachês","20 sachês","25 sachês","50 sachês"],
      unidades:["caixa","pacote"]
    };

  if (/achocolatado líquido|bebida láctea achocolatada/.test(n))
    return {
      marcas:["Toddynho","Nescau","Ninho","Nestlé","Batavo","Parmalat"],
      tipos:["Chocolate","Baunilha","Morango","Zero açúcar"],
      volumes:["200ml","1L"],
      unidades:["unidade","caixinha","fardo 6","caixa 12","caixa 27"]
    };

  // ════════════════════════════════════════════════════
  // PADARIA E MATINAIS — Leites, Pães, Cereais
  // ════════════════════════════════════════════════════

  if (/\bleite\b(?! condensado| de coco)/.test(n))
    return {
      marcas:["Piracanjuba","Italac","Nestlé Ninho","Parmalat","Elegê","Betânia","Vigor","Camponesa"],
      tipos:["Integral","Semidesnatado","Desnatado","Zero lactose","Orgânico","Com ferro e vitaminas"],
      volumes:["1L","500ml"],
      unidades:["caixinha","unidade","fardo 6","caixa 12"]
    };

  if (/pão de forma|pão pullman/.test(n))
    return {
      marcas:["Seven Boys","Wickbold","Plus Vita","Pullman","Bauducco","Ana Maria","Pão de Açúcar"],
      tipos:["Tradicional","Integral","Light","Multigrãos","Sem glúten","Hot dog","Hambúrguer"],
      pesos:["350g","400g","500g","600g","750g"],
      unidades:["pacote","unidade"]
    };

  if (/\bpão\b/.test(n))
    return {
      marcas:["Bauduco","Seven Boys","Pullman","Wickbold","Ana Maria"],
      tipos:["Francês","Bisnaguinha","Hot dog","Hambúrguer","Sírio","Ciabatta","Integral","Brioche"],
      pesos:[],
      unidades:["unidade","pacote","kg","dúzia"]
    };

  if (/iogurte/.test(n))
    return {
      marcas:["Nestlé","Danone","Itambé","Piracanjuba","Vigor","Batavo","Activia","YoPro"],
      tipos:["Natural integral","Natural desnatado","Grego","Morango","Baunilha","Manga","Limão","Blueberry","Zero açúcar","Proteico"],
      pesos:["90g","160g","170g","500g","1kg"],
      unidades:["unidade","pote","bandeja 4","bandeja 6","pacote"]
    };

  // ════════════════════════════════════════════════════
  // FRIOS E LATICÍNIOS
  // ════════════════════════════════════════════════════

  if (/\bqueijo\b/.test(n))
    return {
      marcas:["Forno de Minas","Tirolez","Quatá","Presidente","Polenghi","Vigor","Kraft","BOM"],
      tipos:["Mussarela","Prato","Parmesão ralado","Coalho","Cottage","Ricota","Brie","Provolone","Gouda","Burguer"],
      pesos:["150g","200g","400g","500g","1kg"],
      unidades:["pacote","peça","pote","unidade"]
    };

  if (/manteiga/.test(n))
    return {
      marcas:["Aviação","Tirolez","Vigor","Itambé","Président","Reny Picot","Nestlé"],
      tipos:["Com sal","Sem sal","Extra cremosa","Ghee clarificada"],
      pesos:["200g","500g"],
      unidades:["tablete","pote","unidade"]
    };

  if (/margarina/.test(n))
    return {
      marcas:["Qualy","Becel","Delícia","Doriana","Primor","Vigor","Claybon"],
      tipos:["Com sal","Sem sal","Light","Culinária","Com vitaminas"],
      pesos:["250g","500g","1kg"],
      unidades:["pote","unidade"]
    };

  if (/requeijão/.test(n))
    return {
      marcas:["Catupiry","Vigor","Itambé","Nestlé","Tirolez","Polenghi","Forno de Minas"],
      tipos:["Cremoso tradicional","Light","Zero lactose","Copo","Bisnaga"],
      pesos:["150g","200g","250g","500g"],
      unidades:["pote","copo","bisnaga","unidade"]
    };

  if (/presunto/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Friboi","Rezende"],
      tipos:["Fatiado cozido","Defumado fatiado","Light","Em peça","Tender"],
      pesos:["100g","150g","200g","300g","500g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/mortadela/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Rezende","Bordon"],
      tipos:["Tradicional fatiada","Bologna","Light","Com azeitona","Defumada","Temperada","Em peça"],
      pesos:["200g","300g","500g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/peito de peru/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Chester"],
      tipos:["Fatiado defumado","Grelhado fatiado","Light","Com ervas","Peru defumado"],
      pesos:["100g","150g","200g","300g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/salame/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Milano"],
      tipos:["Italiano fatiado","Milano","Pepperoni","Calabrês","Em peça"],
      pesos:["100g","150g","200g","500g"],
      unidades:["pacote","bandeja","peça"]
    };

  // ════════════════════════════════════════════════════
  // CARNES E AVES
  // ════════════════════════════════════════════════════

  if (/picanha/.test(n))
    return {
      marcas:["Friboi","Mafrig","Minerva","JBS","Marfrig","Swift"],
      tipos:["Bovina","Suína"],
      pesos:["500g","1kg","1,5kg","2kg"],
      unidades:["kg","bandeja","peça"]
    };

  if (/alcatra|fraldinha|contra.filé|filé mignon|maminha|coxão|patinho/.test(n))
    return {
      marcas:["Friboi","Swift","Seara Beef","JBS","Marfrig","Minerva"],
      tipos:["Bovino especial"],
      pesos:["500g","1kg","1,5kg","2kg"],
      unidades:["kg","bandeja"]
    };

  if (/acém|músculo|paleta|ossobuco|cupim/.test(n))
    return {
      marcas:["Friboi","Swift","Marfrig","JBS"],
      tipos:["Para guisado","Para caldo","Para assar"],
      pesos:["500g","1kg","2kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/carne moída/.test(n))
    return {
      marcas:["Friboi","Swift","Seara Beef","JBS"],
      tipos:["Patinho","Acém","Contrafilé","Fraldinha","Músculo"],
      pesos:["500g","1kg"],
      unidades:["bandeja","kg"]
    };

  if (/costela/.test(n))
    return {
      marcas:["Friboi","Swift","Marfrig","Minerva","Resfriada"],
      tipos:["Minga","Janela","Ripa","Suína","Defumada"],
      pesos:["1kg","2kg","3kg","5kg"],
      unidades:["kg","bandeja","peça"]
    };

  if (/\bfrango\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Macedo","Copacol","Diplomata"],
      tipos:["Peito filé","Peito com osso","Coxa e sobrecoxa","Asa","Coxinha da asa","Frango inteiro","Filé temperado","Nuggets"],
      pesos:["500g","1kg","2kg"],
      unidades:["bandeja","kg","pacote"]
    };

  if (/\bpeixe\b/.test(n))
    return {
      marcas:["Pescador","Seara","Temperinha","Isabela","Frescatto"],
      tipos:["Tilápia filé","Salmão filé","Merluza filé","Saint Peter","Cação","Pescada amarela"],
      pesos:["300g","500g","1kg","2kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/\bsalmão\b/.test(n))
    return {
      marcas:["Marine Harvest","Cermaq","Grieg","Frioribe"],
      tipos:["Filé com pele","Filé sem pele","Defumado","Grelhado","In natura"],
      pesos:["300g","500g","1kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/linguiça|calabresa/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Bordon","Rezende"],
      tipos:["Calabresa defumada","Toscana","Frango","Mista","Fininha para churrasco","Meia cura"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","bandeja","kg"]
    };

  if (/\bsalsicha\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Rezende","Bordon"],
      tipos:["Frankfurt","Frango","Vaca e porco","Cocktail","Defumada","Hot dog"],
      pesos:["500g","1kg"],
      unidades:["pacote","bandeja","caixa"]
    };

  if (/hambúrguer|burger/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Friboi","Veggie"],
      tipos:["Bovino","Frango","Misto","Smash","Artesanal","Vegano","Blend"],
      pesos:["56g un","672g (12un)","1,2kg"],
      unidades:["unidade","pacote","caixa"]
    };

  // ════════════════════════════════════════════════════
  // HORTIFRÚTI
  // ════════════════════════════════════════════════════

  if (/\btomate\b(?! de árvore| pelado| extrato| molho| cereja)/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Caqui","Italiano","Débora","Cereja","Grape"],
      pesos:[],
      unidades:["kg","bandeja","unidade"]
    };

  if (/\bcebola\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum amarela","Roxa","Branca"],
      pesos:[],
      unidades:["kg","unidade","saco 1kg","saco 3kg"]
    };

  if (/\balho\b/.test(n))
    return {
      marcas:["Produção nacional","Importado Argentina/China","Arisco pasta"],
      tipos:["Cabeça","Graúdo","Médio","Picado conserva","Pasta de alho"],
      pesos:[],
      unidades:["kg","cabeça","bandeja 100g","bandeja 250g","pote"]
    };

  if (/\bbatata\b(?! chips| frita| palha)/.test(n))
    return {
      marcas:["Produção regional","Bela Vista"],
      tipos:["Inglesa","Doce laranja","Doce roxa","Baroa (mandioquinha)","Bolinha"],
      pesos:[],
      unidades:["kg","saco 1kg","saco 2kg","saco 5kg","unidade"]
    };

  if (/\bcenoura\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Baby","Ralada em conserva"],
      pesos:[],
      unidades:["kg","pacote 500g","saco 1kg","bandeja"]
    };

  if (/\blimão\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Tahiti","Siciliano","Cravo"],
      pesos:[],
      unidades:["kg","unidade","saco 1kg"]
    };

  if (/\bbanana\b/.test(n))
    return {
      marcas:["Produção regional","Dole"],
      tipos:["Prata","Nanica","Da terra","Maçã","Ouro"],
      pesos:[],
      unidades:["kg","cacho","unidade","dúzia"]
    };

  if (/\bmaçã\b/.test(n))
    return {
      marcas:["Dole","Fuji","Gala","Importada"],
      tipos:["Fuji","Gala","Red Delicious","Granny Smith (verde)"],
      pesos:[],
      unidades:["kg","unidade","bandeja 6"]
    };

  if (/\blaranja\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Pera","Bahia","Lima","Valência","Kinkan"],
      pesos:[],
      unidades:["kg","unidade","saco 3kg"]
    };

  if (/\babacate\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Hass","Manteiga"],
      pesos:[],
      unidades:["unidade","kg"]
    };

  if (/\bmelancia\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Com semente","Sem semente","Mini"],
      pesos:[],
      unidades:["unidade","metade","quarto","kg"]
    };

  if (/\balface\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Americana","Crespa","Lisa","Roxa","Romana","Mimosa"],
      pesos:[],
      unidades:["unidade","pé"]
    };

  if (/\bbr[oó]colis\b|\bchuchu\b|\babobrinha\b|\bpimentão\b|\bjiló\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Orgânico"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  // ════════════════════════════════════════════════════
  // BEBIDAS — Cervejas (destaque do Atacadão)
  // ════════════════════════════════════════════════════

  if (/\bcerveja\b/.test(n))
    return {
      marcas:["Brahma","Skol","Antarctica","Heineken","Amstel","Budweiser","Corona","Bohemia","Itaipava","Devassa","Original","Eisenbahn","Baden Baden","Stella Artois"],
      tipos:["Pilsen","Lager puro malte","IPA","Weiss","Stout","Red ale","Sem álcool","Zero álcool"],
      volumes:["Lata 269ml","Lata 350ml","Long neck 355ml","Garrafa 600ml","Litrão 1L"],
      unidades:["unidade","fardo 6","fardo 8","fardo 12","fardo 15","fardo 24","caixa 24"]
    };

  if (/\brefrigerante\b/.test(n))
    return {
      marcas:["Coca-Cola","Pepsi","Guaraná Antarctica","Fanta","Sprite","Kuat","Del Valle","Schweppes","Dolly","Mineirinho"],
      tipos:["Cola","Guaraná","Laranja","Uva","Limão","Tônica","Ginger Ale","Zero açúcar","Light"],
      volumes:["350ml lata","600ml","1L","1,5L","2L","2,5L"],
      unidades:["unidade","fardo 6","fardo 12","pack 6"]
    };

  if (/suco (de caixa|pronto|néctar|em caixa)|néctar/.test(n))
    return {
      marcas:["Del Valle","Sufresh","Minute Maid","Maguary","Do Bem","Taeq","Juxx"],
      tipos:["Laranja","Uva","Maçã","Caju","Manga","Pêssego","Goiaba","Maracujá","Limão","Abacaxi"],
      volumes:["200ml","1L","1,5L"],
      unidades:["caixinha","garrafa","unidade","caixa 6","caixa 12"]
    };

  if (/água de coco/.test(n))
    return {
      marcas:["Do Bem","Kero Coco","Natural One","Amacoco","Frutap"],
      tipos:["Natural","Com polpa","Orgânica","Com colagénio"],
      volumes:["200ml","330ml","1L"],
      unidades:["caixinha","unidade","fardo 12"]
    };

  if (/água mineral|água com gás|água sem gás/.test(n))
    return {
      marcas:["Crystal","Bonafont","Schin","Indaiá","Serra da Canastra","São Lourenço","Perrier","Evian"],
      tipos:["Com gás","Sem gás","Levemente gaseificada","Saborizada"],
      volumes:["300ml","500ml","1,5L","5L","10L","20L"],
      unidades:["unidade","fardo 6","fardo 12","galão"]
    };

  if (/energético|energy drink/.test(n))
    return {
      marcas:["Red Bull","Monster","TNT","Burn","Flash Power","Cafeína","Integralmedica"],
      tipos:["Original","Zero","Tropical","Melancia","Açaí","Mango"],
      volumes:["250ml","355ml","473ml"],
      unidades:["unidade","fardo 4","caixa 6","caixa 12"]
    };

  if (/\bvinho\b/.test(n))
    return {
      marcas:["Miolo","Casa Valduga","Salton","Santa Helena","Almaden","Casillero del Diablo","Don Guerino","Aurora"],
      tipos:["Tinto seco","Tinto suave","Tinto demi-sec","Branco seco","Branco suave","Rosé seco","Espumante brut","Espumante demi-sec","Moscatel"],
      volumes:["375ml","750ml","1L","1,5L"],
      unidades:["garrafa","unidade","caixa 6"]
    };

  if (/\bcachaça\b/.test(n))
    return {
      marcas:["51","Pitú","Ypióca","Velho Barreiro","São Francisco","Caninha","Sagatiba","Weber Haus"],
      tipos:["Comum prata","Ouro envelhecida","Artesanal","Premium"],
      volumes:["700ml","1L","2L"],
      unidades:["garrafa","unidade","fardo 12"]
    };

  if (/\bvodka\b/.test(n))
    return {
      marcas:["Smirnoff","Absolut","Sky","Crystal","Grey Goose","Stolichnaya"],
      tipos:["Pura","Limão","Melancia","Morango","Menta","Blue"],
      volumes:["275ml","700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  if (/whisky|whiskey/.test(n))
    return {
      marcas:["Johnnie Walker","Jack Daniel's","Chivas Regal","White Horse","Old Parr","Black & White","Ballantine's"],
      tipos:["Red Label","Black Label","Gold Label","Tennessee","12 anos","Single malt","Blended"],
      volumes:["750ml","1L","1,75L"],
      unidades:["garrafa","unidade"]
    };

  if (/\brum\b/.test(n))
    return {
      marcas:["Bacardi","Havana Club","Montilla","Old Nick","Captain Morgan"],
      tipos:["Claro","Ouro","Dark","Especiado"],
      volumes:["700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  if (/\bgin\b/.test(n))
    return {
      marcas:["Tanqueray","Beefeater","Gordons","Bombay Sapphire","Hendrick's","Amázzoni"],
      tipos:["London Dry","Floral","Cítrico","Premium"],
      volumes:["700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  // ════════════════════════════════════════════════════
  // CONGELADOS
  // ════════════════════════════════════════════════════

  if (/pão de queijo/.test(n))
    return {
      marcas:["Forno de Minas","Chessy","BemPão","Qualitá","Ana Maria"],
      tipos:["Tradicional","Recheado com queijo","Mini","Integral","Com calabresa"],
      pesos:["400g","1kg","2kg","3kg"],
      unidades:["pacote","caixa","fardo"]
    };

  if (/lasanha/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Nestlé","Batavo","Qualy"],
      tipos:["Bolonhesa","Frango","Quatro queijos","Presunto e queijo","Vegetariana"],
      pesos:["600g","1kg","2kg"],
      unidades:["unidade","caixa","bandeja"]
    };

  if (/\bpizza\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Forno de Pedra","Big Hug","Di Napoli"],
      tipos:["Mussarela","Calabresa","Frango","Margherita","Portuguesa","Pepperoni","Veggie"],
      pesos:["460g","550g","700g","1kg"],
      unidades:["unidade","caixa"]
    };

  if (/batata frita|batata palito/.test(n))
    return {
      marcas:["McCain","Bonduelle","Sadia","Seara","Hortus"],
      tipos:["Palito","Frisada","Ondulada","Rústica","Pré-frita para assar","Batata smile"],
      pesos:["400g","1kg","2kg"],
      unidades:["pacote","caixa"]
    };

  if (/\bsorvete\b/.test(n))
    return {
      marcas:["Kibon","Nestlé","Frutos do Brasil","Vigor","Itambé","Naturello"],
      tipos:["Creme","Chocolate","Morango","Napolitano","Flocos","Açaí","Limão"],
      pesos:["1,5L","2L","3L","5L"],
      unidades:["pote","caixa"]
    };

  if (/nugget|empanado/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","McCain"],
      tipos:["Frango tradicional","Frango com queijo","Veggie","Peixe","Bife empanado"],
      pesos:["300g","500g","1kg","2kg"],
      unidades:["pacote","caixa","bandeja"]
    };

  // ════════════════════════════════════════════════════
  // LIMPEZA — Líquidos
  // ════════════════════════════════════════════════════

  if (/detergente/.test(n))
    return {
      marcas:["Ypê","Limpol","Minuano","Azulim","Brilhante","Scott","Procter"],
      tipos:["Neutro","Limão","Original","Laranja","Concentrado","Bactericida"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","fardo 24"]
    };

  if (/amaciante/.test(n))
    return {
      marcas:["Downy","Comfort","Ypê","Minuano","Fofo","Brilhante"],
      tipos:["Brisa primavera","Lavanda","Floral","Bebê","Concentrado","Refil"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/desinfetante/.test(n))
    return {
      marcas:["Pinho Sol","Veja","Lysol","Ypê","Ajax","Sanifresh","Cif"],
      tipos:["Pinho","Lavanda","Citrus","Floral","Original","Herbal","Eucalipto"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/água sanitária/.test(n))
    return {
      marcas:["Qboa","Candida","Magik","Ypê","Sanol"],
      tipos:["Regular 2,5%","Concentrada 10%","Com fragrância"],
      volumes:["1L","2L","5L"],
      unidades:["frasco","galão","unidade","fardo 12"]
    };

  if (/limpador multiuso|limpa tudo|veja|ajax/.test(n))
    return {
      marcas:["Veja","Ajax","Cif","Mr. Músculo","Lysoform","Ypê","Flash Limp"],
      tipos:["Regular","Desengordurante","Banheiro","Cozinha","Tira-mofos","Anticalcário"],
      volumes:["500ml","1L","2L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/limpa vidro|limpador de vidro/.test(n))
    return {
      marcas:["Veja","Mr. Músculo","Spartan","Lysoform"],
      tipos:["Spray","Concentrado","Com álcool"],
      volumes:["400ml","500ml"],
      unidades:["frasco","unidade"]
    };

  if (/lava.roupas líquido|sabão líquido roupa/.test(n))
    return {
      marcas:["OMO","Ariel","Brilhante","Ypê","Surf","Ace"],
      tipos:["Regular","Concentrado","Color","Bebê","Perfumado"],
      volumes:["1L","2L","3L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/álcool (em gel|líquido|70|46)/.test(n))
    return {
      marcas:["Asseptgel","Álcool Gel Esterilizador","Antisséptico 70°","Backer","Johnsons"],
      tipos:["Álcool 70° líquido","Álcool 46° líquido","Álcool em gel 70°","Spray"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade"]
    };

  // ════════════════════════════════════════════════════
  // LIMPEZA — Sólidos / Papéis
  // ════════════════════════════════════════════════════

  if (/sabão em pó/.test(n))
    return {
      marcas:["OMO","Ariel","Brilhante","Surf","Ypê","Ace","Minuano"],
      tipos:["Regular","Concentrado","Multiação","Com amaciante","Lavanda","Bebê"],
      pesos:["500g","1kg","1,5kg","2kg","3kg","5kg"],
      unidades:["caixa","pacote","balde","fardo"]
    };

  if (/\besponja\b/.test(n))
    return {
      marcas:["Scotch-Brite","Bettanin","Clorox","Assolan","Bombril","Flash Limp"],
      tipos:["Dupla face amarela","Dupla face verde","Macia para antiaderente","Palha de aço","Fralda","Tira-manchas"],
      pesos:[],
      unidades:["unidade","pacote 3","pacote 5","pacote 8","pacote 10"]
    };

  if (/palha de aço/.test(n))
    return {
      marcas:["Bombril","Assolan","Bettanin","Inox"],
      tipos:["Regular","Extra resistente","Inox"],
      pesos:[],
      unidades:["pacote 8","pacote 12","pacote 20","caixa"]
    };

  if (/papel higiênico/.test(n))
    return {
      marcas:["Neve","Personal","Scott","Volare","Mili","Soffione","Toque de Seda"],
      tipos:["Folha simples","Folha dupla","Folha tripla","Neutro","Perfumado","Extra macio","Compacto"],
      pesos:[],
      unidades:["pacote 4","pacote 8","pacote 12","pacote 30","fardo 48","fardo 64"]
    };

  if (/papel toalha/.test(n))
    return {
      marcas:["Neve","Scott","Personal","Volare","Folha de Rosto"],
      tipos:["Simples","Duplo","Multiuso"],
      pesos:[],
      unidades:["rolo","pacote 2","pacote 4","pacote 6","fardo"]
    };

  if (/guardanapo/.test(n))
    return {
      marcas:["Neve","Personal","Scott","Volare","Mili"],
      tipos:["Simples","Duplo","Colorido","Serigrafia"],
      pesos:[],
      unidades:["pacote 50","pacote 100","pacote 200","caixa"]
    };

  if (/saco de lixo/.test(n))
    return {
      marcas:["Veja","Glad","Cia do Lixo","Bettanin","Bompack"],
      tipos:["Preto","Azul","Verde","Colorido","Reforçado","Perfumado"],
      pesos:["10L","15L","30L","50L","60L","100L","200L"],
      unidades:["rolo","pacote","caixa"]
    };

  if (/vassoura/.test(n))
    return {
      marcas:["Mor","Sanremo","Plasvale","Bettanin","Tigre"],
      tipos:["Vassoura mista","Pelo macio","Pelo duro","Vassoura de palha","Vassoura sanitária"],
      pesos:[],
      unidades:["unidade"]
    };

  if (/rodo|mop/.test(n))
    return {
      marcas:["Bettanin","Mor","Sanremo","Flash Limp"],
      tipos:["Rodo 40cm","Rodo 60cm","MOP giratório","MOP flat refil"],
      pesos:[],
      unidades:["unidade","kit com refil"]
    };

  // ════════════════════════════════════════════════════
  // HIGIENE E PERFUMARIA
  // ════════════════════════════════════════════════════

  if (/\bshampoo\b/.test(n))
    return {
      marcas:["Seda","Pantene","Head & Shoulders","Elseve","TRESemmé","Dove","Garnier","Lóreal","Clear","OX","Nazca"],
      tipos:["Limpeza suave","Cabelo oleoso","Cabelo seco","Anticaspa","Infantil","Hidratação intensa","Cachos","Liso","Antiqueda"],
      volumes:["200ml","300ml","400ml","750ml","1L"],
      unidades:["frasco","unidade","kit"]
    };

  if (/condicionador/.test(n))
    return {
      marcas:["Seda","Pantene","Elseve","TRESemmé","Dove","Garnier","Lóreal","OX","Nazca"],
      tipos:["Normal","Ressecado","Cachos","Liso","Antiqueda","Hidratação 3 minutos","Infantil"],
      volumes:["200ml","300ml","400ml","750ml","1L"],
      unidades:["frasco","unidade"]
    };

  if (/creme para cabelo|máscara capilar/.test(n))
    return {
      marcas:["Pantene","Elseve","Dove","TRESemmé","Wella","Keratine"],
      tipos:["Hidratação","Nutrição","Reconstrução","Cachos","Pós-química"],
      pesos:["250g","300g","500g","1kg"],
      unidades:["pote","unidade"]
    };

  if (/sabonete/.test(n))
    return {
      marcas:["Dove","Lux","Protex","Palmolive","Lifebuoy","Nívea","Neutrogena","Francis","Phebo","Kelma"],
      tipos:["Barra hidratante","Barra antibacteriano","Barra esfoliante","Barra aveia","Líquido antibacteriano","Líquido hidratante"],
      pesos:["80g","90g","180g","200g"],
      volumes:["200ml","250ml","400ml"],
      unidades:["unidade","pacote 3","pacote 6","frasco","caixa 12"]
    };

  if (/creme dental|pasta de dente/.test(n))
    return {
      marcas:["Colgate","Oral-B","Sensodyne","Close Up","Sorriso","Signal","Odonto","Aquafresh"],
      tipos:["Branqueador","Clareador","Sensível","Anticárie","Carvão","Infantil","Herbal","Menta refrescante"],
      pesos:["50g","70g","90g","150g","180g","200g"],
      unidades:["unidade","caixa 3","kit família"]
    };

  if (/desodorante/.test(n))
    return {
      marcas:["Rexona","Dove","Axe","Old Spice","Nivea","Gillette","Secret","Monange","Avon"],
      tipos:["Aerosol masculino","Aerosol feminino","Roll-on masculino","Roll-on feminino","Bastão","Creme"],
      volumes:["50ml","75ml","150ml","200ml"],
      unidades:["unidade","frasco","kit 2"]
    };

  if (/fio dental/.test(n))
    return {
      marcas:["Colgate","Oral-B","Johnson","Sanifil","GUM"],
      tipos:["Encerado menta","Não encerado","Ultra clean","Tape","Essencial"],
      pesos:["25m","50m","100m"],
      unidades:["unidade","caixa","kit 3"]
    };

  if (/escova de dente/.test(n))
    return {
      marcas:["Colgate","Oral-B","Sorriso","Sanifil","GUM","Curaprox"],
      tipos:["Macia","Média","Dura","Infantil","Ultrafina","Elétrica"],
      pesos:[],
      unidades:["unidade","pacote 2","pacote 3","pacote 4"]
    };

  if (/absorvente/.test(n))
    return {
      marcas:["Always","Carefree","Intimus","Kotex","OB","Tena","Saba"],
      tipos:["Com abas normal","Com abas noturno","Sem abas","Diário (protetor)","Interno regular","Interno super","Ultra fino"],
      pesos:[],
      unidades:["pacote 8","pacote 16","pacote 32","caixa"]
    };

  if (/fralda/.test(n))
    return {
      marcas:["Pampers","Huggies","Turma da Mônica","MamyPoko","Babysec","Confort"],
      tipos:["RN (recém-nascido)","P","M","G","XG","XXG","XXXG","Geriátrica (adulto)"],
      pesos:[],
      unidades:["pacote","fardo","caixa"]
    };

  if (/lenço umedecido/.test(n))
    return {
      marcas:["Pampers","Huggies","WetKiss","Turma da Mônica","OB","Cottonbaby"],
      tipos:["Bebê sem perfume","Bebê com perfume","Adulto antibacteriano","Íntimo","Facial"],
      pesos:[],
      unidades:["pacote 50","pacote 80","pacote 100","caixa","kit 3"]
    };

  if (/protetor solar|filtro solar/.test(n))
    return {
      marcas:["Neutrogena","Nivea","La Roche-Posay","Sundown","Isdin","Banana Boat","Adcos"],
      tipos:["FPS 30 corpo","FPS 50 corpo","FPS 50+ face","FPS 70 face","Infantil FPS 50","Toque seco","Bronzeador"],
      volumes:["120ml","200ml","300ml"],
      unidades:["frasco","unidade"]
    };

  // ════════════════════════════════════════════════════
  // DESCARTÁVEIS E EMBALAGENS
  // ════════════════════════════════════════════════════

  if (/copo descartável/.test(n))
    return {
      marcas:["Descartline","Copobras","JL Copos","Crystal","Plastilene","Maxpack"],
      tipos:["Plástico 50ml (café)","Plástico 80ml","Plástico 150ml","Plástico 180ml","Plástico 200ml","Plástico 300ml","Plástico 400ml","Plástico 500ml","Papel 180ml","Papel 240ml"],
      pesos:[],
      unidades:["pacote 50","pacote 100","caixa 1.000","caixa 2.500"]
    };

  if (/prato descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack","Crystal"],
      tipos:["Raso 15cm","Raso 18cm","Raso 21cm","Fundo","Sobremesa","Bandeja oval"],
      pesos:[],
      unidades:["pacote 10","pacote 20","pacote 50","caixa"]
    };

  if (/talher descartável|garfo descartável|colher descartável|faca descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack"],
      tipos:["Garfo","Faca","Colher de sobremesa","Colher de sopa","Kit completo","Preto premium"],
      pesos:[],
      unidades:["pacote 50","pacote 100","caixa 1.000"]
    };

  if (/papel alumínio/.test(n))
    return {
      marcas:["Wyda","Reynolds","Aluplast","Brasfort","Prata"],
      tipos:["Regular","Reforçado","Culinário grosso"],
      pesos:["7,5m","30m","45m","50m"],
      unidades:["rolo","caixa"]
    };

  if (/papel filme|filme plástico/.test(n))
    return {
      marcas:["Wyda","Reynolds","Aluplast","PVC"],
      tipos:["PVC regular","PVC reforçado"],
      pesos:["28m","30m","50m"],
      unidades:["rolo","caixa"]
    };

  if (/embalagem|marmita plástica|pote descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack","Plasútil","Plastipak"],
      tipos:["Pote 250ml","Pote 350ml","Pote 500ml","Marmita 750ml","Marmita 1L","Marmita 1,5L","Marmita 2L"],
      pesos:[],
      unidades:["unidade","pacote 10","pacote 25","caixa 100"]
    };

  if (/palito de dente|palito|guardanapo porta/.test(n))
    return {
      marcas:["Palissandro","Jontex","Familiar"],
      tipos:["Palito de madeira","Palito bambu","Palito com menta"],
      pesos:[],
      unidades:["caixa 200","caixa 1.000","pacote"]
    };

  // ════════════════════════════════════════════════════
  // MATERIAL DE CONSTRUÇÃO
  // ════════════════════════════════════════════════════

  if (/cimento/.test(n))
    return {
      marcas:["Votoran","Itambé","Ciplan","InterCement","Cauê"],
      tipos:["CP II-E","CP II-F","CP III","CP IV","Branco estrutural","Refratário"],
      pesos:["1kg","5kg","25kg","50kg"],
      unidades:["saco","kg"]
    };

  if (/argamassa/.test(n))
    return {
      marcas:["Votomassa","Revestex","Cimentcola","Qualicola","Plitex"],
      tipos:["Chapisco","Reboco","Assentamento tijolo","AC1 piso interno","AC2 piso externo","AC3 piscina"],
      pesos:["5kg","20kg","50kg"],
      unidades:["saco"]
    };

  if (/\btinta\b/.test(n))
    return {
      marcas:["Suvinil","Coral","Iquine","Lukscolor","Sayerlack","Montana","Renner"],
      tipos:["Acrílica fosca","Acrílica semibrilho","PVA econômica","Esmalte sintético","Verniz","Primer","Selador"],
      volumes:["900ml","3,6L","18L"],
      unidades:["lata","galão","balde"]
    };

  // ════════════════════════════════════════════════════
  // MATERIAL ELÉTRICO
  // ════════════════════════════════════════════════════

  if (/\blâmpada\b/.test(n))
    return {
      marcas:["Philips","Osram","GE","Ledvance","Avant","Elgin"],
      tipos:["LED bulbo","LED tubular","LED PAR30","Fluorescente compacta","Halógena","Filamento retrô"],
      pesos:["9W","12W","15W","25W","40W","60W"],
      unidades:["unidade","caixa 3","caixa 5","caixa 10"]
    };

  if (/\bfio\b|\bcabo elétrico\b/.test(n))
    return {
      marcas:["Nexans","Phelps Dodge","Cobrecom","Ficap","Conduspar"],
      tipos:["Flexível","Rígido","Paralelo PP","PP borracha","PPJA"],
      pesos:["1,5mm²","2,5mm²","4mm²","6mm²","10mm²"],
      unidades:["metro","rolo 50m","rolo 100m"]
    };

  if (/disjuntor/.test(n))
    return {
      marcas:["Schneider","WEG","ABB","Siemens","Intesis","Pial"],
      tipos:["Monopolar","Bipolar","Tripolar","DR residencial","DPS surto"],
      pesos:["10A","16A","20A","25A","32A","40A","50A","63A"],
      unidades:["unidade"]
    };

  // ════════════════════════════════════════════════════
  // DEFAULT — produto não mapeado
  // ════════════════════════════════════════════════════
  return {
    marcas: [],
    tipos: [],
    pesos: [],
    volumes: [],
    unidades: ["unidade","pacote","caixa","kg","g","L","ml","fardo","lata","garrafa","dúzia","par","peça"],
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function parseBRL(str) {
  if (!str && str !== 0) return null;
  const clean = String(str)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const val = parseFloat(clean);
  return Number.isNaN(val) ? null : val;
}
function fmtBRL(val) {
  if (val == null || isNaN(val)) return "";
  return val.toFixed(2).replace(".",",");
}
function fmtR(val) { return "R$ " + fmtBRL(val); }

// ── AI ─────────────────────────────────────────────────────────────────────
async function aiOrganize(items, type) {
  const typeName = TYPE_NAMES[type] || "geral";
  const list = items
    .map((i) => `${[i.marca, i.tipo, i.name, i.embalagem || i.peso || i.volume].filter(Boolean).join(" ")} - ${i.qty} ${i.unit}`)
    .join("\n");

  const prompt = `Organize em categorias para lista de "${typeName}". Retorne APENAS JSON válido, sem markdown:
{"categories":[{"name":"Categoria","items":[{"name":"Nome","detail":"tipo e tamanho","qty":1,"unit":"un","price":null,"checked":false}]}]}

ITENS:
${list}

Regras: categorias em português do Brasil, máximo 8 categorias, preserve qty e unit exatos.`;

  const parsed = await callAnthropicJSON({
    prompt,
    model: ANTHROPIC_MODEL_ORGANIZE,
    maxTokens: 2000,
  });

  const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
  categories.forEach((c) => {
    c.items = Array.isArray(c.items) ? c.items : [];
    c.items.forEach((i) => {
      i.checked = false;
      i.price = null;
      i.notFound = false;
    });
  });
  return categories;
}

function demoOrganize(items) {
  // Categorias alinhadas ao Atacadão
  const map = [
    [["arroz","feijão","macarrão","farinha","açúcar","sal","azeite","óleo","molho","vinagre","extrato","milho","linhaça","chia","atum","sardinha"],"Mercearia"],
    [["carne","frango","peixe","linguiça","bacon","costela","picanha","bife","filé","salsicha","hambúrguer"],"Carnes e Aves"],
    [["leite","iogurte","queijo","manteiga","requeijão","creme de leite","nata","margarina","presunto","mortadela","salame","peito de peru"],"Frios e Laticínios"],
    [["alface","tomate","cebola","alho","batata","cenoura","limão","banana","maçã","laranja","fruta","legume","verdura","melancia","abacate","brócolis"],"Hortifruti"],
    [["pão de queijo","lasanha","pizza","sorvete","batata frita"],"Congelados"],
    [["detergente","sabão","desinfetante","vassoura","esponja","limpador","água sanitária","amaciante","palha","multiuso","rodo"],"Limpeza"],
    [["shampoo","sabonete","creme dental","escova","fio dental","desodorante","condicionador","absorvente","fralda","papel higiênico"],"Higiene e Perfumaria"],
    [["café","chá","achocolatado","nescau"],"Cafés e Chás"],
    [["cerveja","refrigerante","suco","água","energético","água de coco"],"Bebidas"],
    [["vinho","cachaça","vodka","whisky","rum","gin"],"Bebidas Alcoólicas"],
    [["biscoito","salgadinho","chocolate","bolacha","snack","chips","barra","pipoca"],"Snacks e Doces"],
    [["pão","torrada","cereal","aveia","granola"],"Padaria e Matinais"],
    [["copo descartável","prato descartável","talher","papel alumínio","papel filme","embalagem"],"Descartáveis e Embalagens"],
  ];
  const cats = {};
  items.forEach(item=>{
    const n=item.name.toLowerCase();
    let found=false;
    for (const [keys,cat] of map) {
      if (keys.some(k=>n.includes(k))) {
        if (!cats[cat]) cats[cat]=[];
        const detail=[item.marca,item.tipo,item.embalagem||item.peso||item.volume].filter(Boolean).join(" ");
        cats[cat].push({name:item.name,detail,qty:item.qty,unit:item.unit,price:null,checked:false,notFound:false});
        found=true;break;
      }
    }
    if(!found){
      if(!cats["Outros"])cats["Outros"]=[];
      const detail=[item.marca,item.tipo,item.embalagem||item.peso||item.volume].filter(Boolean).join(" ");
      cats["Outros"].push({name:item.name,detail,qty:item.qty,unit:item.unit,price:null,checked:false,notFound:false});
    }
  });
  return Object.entries(cats).map(([name,items])=>({name,items}));
}

// ── ESTILOS BASE ───────────────────────────────────────────────────────────
const inp = (extra={})=>({width:"100%",padding:"13px 16px",border:"2px solid #E0E4EA",borderRadius:10,fontSize:16,color:"#1A202C",outline:"none",fontFamily:"inherit",background:"white",boxSizing:"border-box",...extra});
const lbl = {fontWeight:700,fontSize:13,color:"#4A5568",marginBottom:8,display:"block"};
const chip = (sel,bc="#7C3AED",bg="#EDE9FE",tc="#6D28D9")=>({flexShrink:0,padding:"9px 14px",borderRadius:100,border:`2px solid ${sel?bc:"#E0E4EA"}`,background:sel?bg:"white",fontWeight:700,fontSize:13,color:sel?tc:"#8896A8",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"});
const btnG = {width:"100%",padding:16,borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8};
const btnGr = {padding:"13px 16px",borderRadius:10,background:"white",border:"2px solid #E0E4EA",color:"#4A5568",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"};
const qBtn = {width:44,height:44,borderRadius:"50%",border:"2px solid #E0E4EA",background:"white",fontSize:22,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"};

function ModalSheet({onClose,children}){
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"white",borderRadius:"24px 24px 0 0",padding:"20px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:"#E0E4EA",borderRadius:2,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]=useState("home");
  const [lists,setLists]=useState(()=>{try{return JSON.parse(localStorage.getItem("tnl_lists")||"[]")}catch{return[]}});
  const [currentList,setCurrentList]=useState(null);
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState({show:false,msg:""});
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [showFinished,setShowFinished]=useState(false);
  const toastTimer=useRef(null);
  const searchRef=useRef(null);
  const listRef=useRef(null);

  // Create
  const [listName,setListName]=useState("");
  const [listType,setListType]=useState("mercado");
  const [budgetEnabled,setBudgetEnabled]=useState(false);
  const [budgetText,setBudgetText]=useState("");
  const [pendingItems,setPendingItems]=useState([]);
  const [currentInput,setCurrentInput]=useState("");

  // Product dialog
  const [itemDialog,setItemDialog]=useState(null);
  const [dlgMarca,setDlgMarca]=useState("");
  const [dlgTipo,setDlgTipo]=useState("");
  const [dlgPeso,setDlgPeso]=useState("");
  const [dlgVolume,setDlgVolume]=useState("");
  const [dlgQty,setDlgQty]=useState(1);
  const [dlgUnit,setDlgUnit]=useState("unidade");
  const [dlgConfig,setDlgConfig]=useState(null);
  const [editPendingIdx,setEditPendingIdx]=useState(null);
  const [listNameConfirmed,setListNameConfirmed]=useState(false);
  const [budgetConfirmed,setBudgetConfirmed]=useState(false);
  const [showPasteModal,setShowPasteModal]=useState(false);
  const [pasteText,setPasteText]=useState("");
  const [reuseModal,setReuseModal]=useState(null);
  const [listMenuId,setListMenuId]=useState(null);
  const [mNotFound,setMNotFound]=useState(false);

  // List screen
  const [search,setSearch]=useState("");
  const [collapsedCats,setCollapsedCats]=useState({});

  // Item modal
  const [itemModal,setItemModal]=useState(null);
  const [mQty,setMQty]=useState(1);
  const [mPriceText,setMPriceText]=useState("");

  // Extra modal
  const [extraModal,setExtraModal]=useState(false);
  const [exName,setExName]=useState("");
  const [exQty,setExQty]=useState(1);
  const [exUnit,setExUnit]=useState("unidade");
  const [exPrice,setExPrice]=useState("");

  const [shareModal,setShareModal]=useState(false);
  const [checkPopup,setCheckPopup]=useState(null);
  const [showSuggestions,setShowSuggestions]=useState(false);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [installAvailable,setInstallAvailable]=useState(false);

  const showToast=useCallback((msg,duration=2800)=>{
    clearTimeout(toastTimer.current);
    setToast({show:true,msg});
    toastTimer.current=setTimeout(()=>setToast({show:false,msg:""}),duration);
  },[]);

  const saveLists=(nl)=>{setLists(nl);localStorage.setItem("tnl_lists",JSON.stringify(nl));};

  const scrollToListTop=useCallback(()=>{
    window.scrollTo({top:0,behavior:"smooth"});
    if(listRef.current)listRef.current.scrollTo({top:0,behavior:"smooth"});
    setTimeout(()=>searchRef.current?.focus?.(),180);
  },[]);

  const getPublicAppUrl=()=>{
    const origin=window.location?.origin;
    const path=window.location?.pathname || "/";
    if(origin && origin!=="null") return `${origin}${path}`.replace(/\/index\.html$/,"/");
    return String(window.location?.href || "").split("#")[0];
  };

  const shareAppWhatsApp=()=>{
    const appUrl=getPublicAppUrl();
    const text=`Conheça o app Tá na Lista:\n${appUrl}`;
    const encoded=encodeURIComponent(text);
    const whatsappUrl=`https://api.whatsapp.com/send?text=${encoded}`;
    const opened=window.open(whatsappUrl,"_blank","noopener,noreferrer");
    if(!opened){
      window.location.href=whatsappUrl;
    }
  };

  useEffect(()=>{
    const handler=(event)=>{
      event.preventDefault();
      setInstallPrompt(event);
      setInstallAvailable(true);
    };
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  const installApp=async()=>{
    if(!installPrompt){
      showToast("Para adicionar à Tela de Início, toque no menu do navegador e escolha Adicionar à Tela de Início.",6500);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice.catch(()=>null);
    setInstallPrompt(null);
    setInstallAvailable(false);
  };

  const makeShareUrl=(sharedId)=>{
    const origin=window.location?.origin;
    if(origin && origin!=="null") return `${origin}/?lista=${encodeURIComponent(sharedId)}`;
    const href=String(window.location?.href || "").split("?")[0].split("#")[0];
    return `${href}?lista=${encodeURIComponent(sharedId)}`;
  };

  const extractSharedIdFromUrl=()=>{
    try{
      const url=new URL(window.location.href);
      const byQuery=url.searchParams.get("lista");
      if(byQuery)return byQuery;
      const m=url.pathname.match(/\/lista\/([^/]+)/);
      return m?decodeURIComponent(m[1]):null;
    }catch{return null;}
  };

  const buildShareText=(list,link)=>{
    const{fullTotal,notFoundItems}=getProgress(list);
    const lines=[];
    lines.push("🛒 *"+(list?.name||"Lista de compras")+"* — Tá na Lista");
    if(list?.budget>0)lines.push("💰 Orçamento: "+fmtR(list.budget));
    lines.push("");
    (list?.categories||[]).forEach(cat=>{
      const theme=getCatTheme(cat.name);
      const sub=getCatSubtotal(cat);
      lines.push(theme.icon+" *"+cat.name+"*"+(sub>0?" — "+fmtR(sub):""));
      (cat.items||[]).forEach(i=>{
        const status=i.notFound?"❌":i.checked?"✅":"⬜";
        const detail=i.detail?" ("+i.detail+")":"";
        const qty=i.qty>1?" "+i.qty+"×":"";
        const price=i.price!=null?" — "+fmtR(i.price*(i.qty||1)):"";
        lines.push(status+" "+i.name+detail+qty+price);
      });
      lines.push("");
    });
    lines.push("💰 *Total: "+fmtR(fullTotal)+"*");
    if(notFoundItems>0)lines.push("❌ "+notFoundItems+" item"+(notFoundItems>1?"s":"")+" não encontrado"+(notFoundItems>1?"s":""));
    if(link){
      lines.push("");
      lines.push("📲 Abrir esta lista no app Tá na Lista:");
      lines.push(link);
      lines.push("");
      lines.push("Se ainda não usa o app, abra o link e toque em ‘Adicionar à Tela de Início’.");
    }
    return lines.join("\n");
  };

  const publishSharedList=async(list)=>{
    if(!list)throw new Error("Lista não encontrada.");
    if(list.sharedId)return{sharedId:list.sharedId,link:makeShareUrl(list.sharedId),list};

    const record=await createSharedListRecord(list);
    if(!record?.id)throw new Error("Não foi possível gerar o link da lista.");

    const updated={...list,sharedId:record.id,sharedAt:new Date().toISOString()};
    setCurrentList(prev=>prev&&prev.id===list.id?updated:prev);
    saveLists(lists.map(l=>l.id===list.id?updated:l));
    return{sharedId:record.id,link:makeShareUrl(record.id),list:updated};
  };

  const loadSharedListFromUrl=useCallback(async()=>{
    const sharedId=extractSharedIdFromUrl();
    if(!sharedId)return;
    setLoading(true);
    try{
      const record=await getSharedListRecord(sharedId);
      if(!record?.data)throw new Error("Lista compartilhada não encontrada.");
      const received={
        ...record.data,
        id:record.data.id||("shared-"+sharedId),
        sharedId,
        isShared:true,
        receivedAt:new Date().toISOString(),
      };
      const existing=JSON.parse(localStorage.getItem("tnl_lists")||"[]");
      const already=existing.some(l=>l.sharedId===sharedId||l.id===received.id);
      if(!already){
        const nl=[received,...existing];
        setLists(nl);
        localStorage.setItem("tnl_lists",JSON.stringify(nl));
      }
      setCurrentList(received);
      setScreen("list");
      setSearch("");
      setCollapsedCats({});
      showToast("📲 Lista aberta no Tá na Lista");
    }catch(err){
      showToast("⚠️ Não foi possível abrir a lista: "+(err?.message||"erro"),5200);
    }finally{
      setLoading(false);
    }
  },[showToast]);

  useEffect(()=>{loadSharedListFromUrl();},[loadSharedListFromUrl]);

  // ── Dialog de produto ─────────────────────────────────────────────────
  // ── Classificação por IA em tempo real ──────────────────────────────
  const [dlgLoading, setDlgLoading] = useState(false);

  const openProductDialog = async (name, existing=null) => {
    if (existing) {
      const cfg = getProductConfig(name);
      setDlgConfig(cfg);
      setDlgMarca(existing.marca||"");
      setDlgTipo(existing.tipo||"");
      setDlgPeso(existing.peso||"");
      setDlgVolume(existing.volume||"");
      setDlgQty(existing.qty||1);
      setDlgUnit(existing.unit||cfg.unidades?.[0]||"unidade");
      setItemDialog({name});
      return;
    }
    // Novo item: abre diálogo com loading, chama IA
    setDlgLoading(true);
    setDlgConfig(null);
    setDlgMarca(""); setDlgTipo(""); setDlgPeso(""); setDlgVolume("");
    setDlgQty(1); setDlgUnit("unidade");
    setItemDialog({name});
    try {
      const cfg = await classifyProduct(name);
      setDlgConfig(cfg);
      setDlgMarca(cfg.marcas?.[0]||"");
      setDlgTipo(cfg.tipos?.[0]||"");
      setDlgPeso(cfg.pesos?.[0]||"");
      setDlgVolume(cfg.volumes?.[0]||"");
      setDlgUnit(cfg.unidades?.[0]||"unidade");
    } catch(err) {
      const cfg = getProductConfig(name);
      setDlgConfig(cfg);
      setDlgMarca(cfg.marcas?.[0]||"");
      setDlgTipo(cfg.tipos?.[0]||"");
      setDlgPeso(cfg.pesos?.[0]||"");
      setDlgVolume(cfg.volumes?.[0]||"");
      setDlgUnit(cfg.unidades?.[0]||"unidade");
      showToast("⚠️ Classificação básica: " + (err?.message||"").substring(0,40));
    } finally {
      setDlgLoading(false);
    }
  };

  const handleAddItem = async () => {
    const name = currentInput.trim();
    if (!name) return;
    await openProductDialog(name);
  };

  const confirmDialog = () => {
    const embalagem = dlgPeso||dlgVolume||"";
    const newItem = {
      name: itemDialog.name,
      marca: dlgMarca||"",
      tipo: dlgTipo||"",
      embalagem,
      peso: dlgPeso,
      volume: dlgVolume,
      qty: dlgQty,
      unit: dlgUnit,
      price: null,
      checked: false,
      notFound: false
    };
    if (editPendingIdx != null) {
      setPendingItems(prev=>prev.map((it,i)=>i===editPendingIdx?newItem:it));
      setEditPendingIdx(null);
    } else {
      setPendingItems(prev=>[...prev,newItem]);
    }
    setItemDialog(null);
    setCurrentInput("");
    showToast(editPendingIdx!=null?"✏️ Atualizado":"✅ "+itemDialog.name+" adicionado");
  };

  const editPendingItem=(idx)=>{
    setEditPendingIdx(idx);
    openProductDialog(pendingItems[idx].name,pendingItems[idx]);
  };

  // ── Organizar ─────────────────────────────────────────────────────────
  const organizeList=async()=>{
    if(pendingItems.length===0){showToast("⚠️ Adicione pelo menos um item");return;}
    setLoading(true);
    try{
      let categories;
      try{categories=await aiOrganize(pendingItems,listType);}
      catch{categories=demoOrganize(pendingItems);showToast("⚠️ IA indisponível — organização básica");}
      const newList={id:Date.now().toString(),name:listName.trim()||"Minha lista",type:listType,budget:parseBRL(budgetText)||0,categories,createdAt:new Date().toISOString(),total:0};
      const nl=[newList,...lists];
      saveLists(nl);
      setCurrentList(newList);
      setPendingItems([]);setListName("");setBudgetText("");setBudgetEnabled(false);setListType("mercado");setCurrentInput("");setListNameConfirmed(false);setBudgetConfirmed(false);
      setScreen("list");setSearch("");setCollapsedCats({});
      showToast("✅ Lista organizada!");
    }finally{setLoading(false);}
  };

  // ── Reutilizar lista ─────────────────────────────────────────────────
  const reuseList=(list)=>{
    setListName(list.name+" (copia)");
    setListType(list.type);
    setBudgetText(list.budget>0?fmtBRL(list.budget):"");
    setBudgetEnabled(list.budget>0);
    setBudgetConfirmed(false);
    setListNameConfirmed(false);
    const items=list.categories.flatMap(c=>c.items.map(i=>({name:i.name,marca:"",tipo:i.detail||"",embalagem:"",peso:"",volume:"",qty:i.qty,unit:i.unit,price:null,checked:false,notFound:false})));
    setPendingItems(items);
    setScreen("create");
    setReuseModal(null);
  };

  // ── Importar texto colado ─────────────────────────────────────────────
  const parsePastedText=()=>{
    const lines=pasteText.split("\n").map(l=>l.trim()).filter(l=>l.length>1);
    const items=lines.map(line=>{
      let clean=line.trim();
      let qty=1,unit="unidade";
      // Tenta extrair quantidade ANTES de remover prefixos de lista
      const qPatterns=[
        /^(\d+[,.]?\d*)\s*[xX]\s+(.+)$/,
        /^(\d+[,.]?\d*)\s*(kg|g|L|ml|un|unidade|pacote|caixa|lata|garrafa|fardo)\s+(.+)$/i,
        /^(\d+[,.]?\d*)\s+(.+)$/,
      ];
      let matched=false;
      for(const p of qPatterns){
        const m=clean.match(p);
        if(m){
          const n=parseFloat(m[1].replace(",","."));
          if(!isNaN(n)&&n>0&&n<1000){
            qty=n;
            if(m.length===4){unit=m[2].toLowerCase();clean=m[3].trim();}
            else{clean=m[2].trim();}
            matched=true;break;
          }
        }
      }
      // Se não encontrou quantidade, remove prefixos de lista (-, •, 1., 2) etc)
      if(!matched){
        clean=clean.replace(/^[\s•\-\*]+/,"").trim();
        clean=clean.replace(/^\d+[.):]\s*/,"").trim();
      }
      return{name:clean,marca:"",tipo:"",embalagem:"",peso:"",volume:"",qty,unit,price:null,checked:false,notFound:false};
    }).filter(i=>i.name.length>0);
    setPendingItems(prev=>[...prev,...items]);
    setPasteText("");
    setShowPasteModal(false);
    showToast("✅ "+items.length+" itens importados!");
  };

  // ── Progress ──────────────────────────────────────────────────────────
  const getProgress=(list)=>{
    if(!list)return{totalItems:0,checkedItems:0,fullTotal:0,notFoundItems:0};
    let t=0,c=0,s=0,nf=0;
    list.categories.forEach(cat=>cat.items.forEach(i=>{t++;if(i.checked)c++;if(i.notFound)nf++;if(i.price!=null)s+=i.price*(i.qty||1);}));
    return{totalItems:t,checkedItems:c,fullTotal:s,notFoundItems:nf};
  };
  const getCatSubtotal=(cat)=>cat.items.reduce((s,i)=>s+(i.price!=null?i.price*i.qty:0),0);

  const updateList=(ul)=>{
    const{fullTotal}=getProgress(ul);ul.total=fullTotal;
    setCurrentList({...ul});
    saveLists(lists.map(l=>l.id===ul.id?ul:l));
  };

  const toggleCheck=(ci,ii)=>{
    const item=currentList.categories[ci].items[ii];
    if(item.checked){
      const l=JSON.parse(JSON.stringify(currentList));
      l.categories[ci].items[ii].checked=false;
      l.categories[ci].items[ii].price=null;
      updateList(l);
      setSearch("");
      setTimeout(scrollToListTop,100);
      return;
    }
    setCheckPopup({ci,ii});
  };

  const openItemModal=(ci,ii)=>{
    const item=currentList.categories[ci].items[ii];
    setItemModal({ci,ii});setMQty(item.qty||1);setMPriceText(item.price!=null?fmtBRL(item.price):"");
    setMNotFound(item.notFound||false);
  };

  const confirmItem=()=>{
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[itemModal.ci].items[itemModal.ii];
    item.qty=mQty;
    item.notFound=mNotFound;
    if(mNotFound){
      item.checked=false;item.price=null;
    } else {
      const p=parseBRL(mPriceText);
      if(p!=null&&p>=0)item.price=p;
      item.checked=true;
    }
    updateList(l);
    showToast(mNotFound?"❌ Nao encontrado":"✅ "+item.name);
    setItemModal(null);
    setSearch("");
    setTimeout(scrollToListTop,100);
    const allDone=l.categories.every(c=>c.items.every(i=>i.checked||i.notFound));
    if(allDone&&l.categories.reduce((s,c)=>s+c.items.length,0)>0)setTimeout(()=>setShowFinished(true),400);
  };

  const removeItem=()=>{
    const l=JSON.parse(JSON.stringify(currentList));
    l.categories[itemModal.ci].items.splice(itemModal.ii,1);
    if(l.categories[itemModal.ci].items.length===0)l.categories.splice(itemModal.ci,1);
    updateList(l);setItemModal(null);showToast("🗑 Removido");
  };

  const quickAdjust=(ci,ii,delta)=>{
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[ci].items[ii];
    const newQty=Math.max(0.5,Math.round((item.qty+delta)*10)/10);
    item.qty=newQty;
    updateList(l);
    setSearch("");
    setTimeout(scrollToListTop,100);
    showToast(delta>0?"+" +delta+" "+item.name:delta+" "+item.name);
  };

  const getSuggestions=()=>{
    if(!currentList||budgetDiff===null||budgetDiff>=0)return[];
    const overBy=Math.abs(budgetDiff);
    const superfluous=["Bebidas Alcoólicas","Cervejas","Vinhos","Destilados","Snacks","Doces","Chocolates","Itens Extras"];
    const candidates=[];

    currentList.categories.forEach((cat,ci)=>{
      const isSuper=superfluous.some(s=>cat.name.includes(s));
      cat.items.forEach((item,ii)=>{
        if(!item.checked||item.price==null)return;
        const total=item.price*(item.qty||1);
        if((item.qty||1)>1){
          candidates.push({ci,ii,name:item.name,qty:item.qty,price:item.price,tipo:"reduzir",catName:cat.name,economy:item.price,priority:isSuper?1:2});
        }
        candidates.push({ci,ii,name:item.name,qty:item.qty||1,price:item.price,tipo:"remover",catName:cat.name,economy:total,priority:isSuper||cat.name==="Itens Extras"?0:3});
      });
    });

    candidates.sort((a,b)=>a.priority-b.priority||b.economy-a.economy);
    const selected=[];
    let acc=0;
    const usedRemove=new Set();
    for(const item of candidates){
      const key=item.ci+":"+item.ii;
      if(item.tipo==="reduzir"&&usedRemove.has(key))continue;
      selected.push(item);
      acc+=item.economy;
      if(item.tipo==="remover")usedRemove.add(key);
      if(acc>=overBy)break;
    }
    return selected;
  };

  const addExtra=()=>{
    if(!exName.trim()){showToast("⚠️ Digite o nome");return;}
    const l=JSON.parse(JSON.stringify(currentList));
    let cat=l.categories.find(c=>c.name==="Itens Extras");
    if(!cat){cat={name:"Itens Extras",items:[]};l.categories.push(cat);}
    cat.items.push({name:exName.trim(),detail:"",qty:exQty,unit:exUnit,price:parseBRL(exPrice),checked:false});
    updateList(l);setExtraModal(false);
    setExName("");setExQty(1);setExUnit("unidade");setExPrice("");
    showToast("⭐ Item extra adicionado!");
  };

  const deleteList=(id)=>{saveLists(lists.filter(l=>l.id!==id));setConfirmDelete(null);showToast("🗑 Lista excluída");};

  // ── Compartilhamento da lista ─────────────────────────────────────────────
  const shareWhatsApp=async(listArg=null)=>{
    const list=listArg||currentList;
    if(!list)return;
    try{
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareText(published,link);
      window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
    }catch(err){
      showToast("⚠️ Erro ao gerar link: "+(err?.message||"verifique o Supabase"),5200);
    }
  };

  const shareTelegram=async(listArg=null)=>{
    const list=listArg||currentList;
    if(!list)return;
    try{
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareText(published,link);
      window.open("https://telegram.me/share/url?url="+encodeURIComponent(link)+"&text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
    }catch(err){
      showToast("⚠️ Erro ao gerar link: "+(err?.message||"verifique o Supabase"),5200);
    }
  };

  const shareOtherApps=async(listArg=null)=>{
    const list=listArg||currentList;
    if(!list)return;
    try{
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareText(published,link);
      if(navigator.share){
        await navigator.share({title:"Tá na Lista — "+published.name,text,url:link}).catch(()=>null);
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(text);
        showToast("📋 Lista e link copiados!");
      }
    }catch(err){
      showToast("⚠️ Erro ao gerar link: "+(err?.message||"verifique o Supabase"),5200);
    }
  };

  const{totalItems,checkedItems,fullTotal}=getProgress(currentList);
  const budget=currentList?.budget||0;
  const budgetDiff=budget>0?budget-fullTotal:null;
  const pct=budget>0?Math.min(100,(fullTotal/budget)*100):totalItems>0?(checkedItems/totalItems)*100:0;

  // ── Preview do item no diálogo ────────────────────────────────────────
  const dlgPreview=itemDialog?[dlgQty+" "+dlgUnit,dlgTipo,itemDialog.name,dlgPeso||dlgVolume].filter(Boolean).join(" · "):"";

  // ─────────────────────────────────────────────────────────────────────
  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:"#F0F2F5",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative"}}>

      {/* LOADING */}
      {loading&&(
        <div style={{position:"fixed",inset:0,background:"rgba(255,255,255,0.94)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:"50%",border:"4px solid #B3F0D6",borderTopColor:"#7C3AED",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{fontWeight:700,fontSize:15,color:"#4A5568"}}>✨ Organizando com IA...</div>
        </div>
      )}

      {/* TOAST */}
      <div style={{position:"fixed",bottom:100,left:16,right:16,margin:"0 auto",maxWidth:460,transform:`translateY(${toast.show?0:16}px)`,background:"#1A202C",color:"white",padding:"14px 18px",borderRadius:18,fontSize:14,fontWeight:600,zIndex:600,opacity:toast.show?1:0,transition:"all 0.3s",whiteSpace:"normal",lineHeight:1.35,textAlign:"center",boxShadow:"0 14px 30px rgba(0,0,0,0.25)",pointerEvents:"none"}}>
        {toast.msg}
      </div>

      {/* LISTA FINALIZADA */}
      {showFinished&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:24,padding:32,textAlign:"center",maxWidth:360,width:"100%"}}>
            <div style={{fontSize:64,marginBottom:12}}>🎉</div>
            <div style={{fontWeight:900,fontSize:22,color:"#1A202C",marginBottom:8}}>Lista finalizada!</div>
            <div style={{fontSize:14,color:"#8896A8",marginBottom:12}}>Todos os itens foram marcados.</div>
            <div style={{fontWeight:800,fontSize:22,color:"#6D28D9",marginBottom:16}}>{fmtR(fullTotal)}</div>
            {budget>0&&(
              <div style={{fontSize:13,fontWeight:700,marginBottom:20,color:fullTotal>budget?"#E53935":"#43A047"}}>
                {fullTotal>budget?`⚠️ Acima do orçamento em ${fmtR(fullTotal-budget)}`:`✅ Dentro do orçamento! Economizou ${fmtR(budget-fullTotal)}`}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setShowFinished(false);shareWhatsApp();}}
                style={{flex:1,padding:14,borderRadius:10,background:"#25D366",border:"none",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                💬 WhatsApp
              </button>
              <button onClick={()=>setShowFinished(false)}
                style={{flex:1,padding:14,borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          HOME
      ════════════════════════════════════ */}
      {listMenuId&&screen==="home"&&<div onClick={()=>setListMenuId(null)} style={{position:"fixed",inset:0,zIndex:298}}/>}
      {screen==="home"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <div style={{background:"linear-gradient(145deg,#7C3AED 0%,#6D28D9 50%,#4C1D95 100%)",padding:"52px 24px 36px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,background:"rgba(255,255,255,0.07)",borderRadius:"50%"}}/>
            <div style={{position:"absolute",bottom:-30,left:-30,width:160,height:160,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}}/>
            <div style={{position:"relative",textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:30,color:"white",letterSpacing:"-0.5px",lineHeight:1,marginBottom:12}}>Tá na Lista</div>
              <div style={{width:64,height:64,borderRadius:18,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 12px"}}>🛍️</div>
              <div style={{color:"rgba(255,255,255,0.88)",fontSize:12,lineHeight:1.3,fontStyle:"italic"}}>Organize, Compartilhe sua lista e Controle o orçamento</div>
            </div>
          </div>
          <div style={{padding:24,flex:1,paddingBottom:100}}>
            <div style={{fontWeight:800,fontSize:12,color:"#8896A8",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:14}}>Módulos</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}}>
              {[
                {icon:"🛒",name:"Compras",desc:"Lista inteligente",active:true},
                {icon:"🎉",name:"Festa",  desc:"Churrasco e eventos",active:false},
                {icon:"🍕",name:"Conta",  desc:"Dividir no restaurante",active:false},
                {icon:"💊",name:"Saúde",  desc:"Receitas e remédios",active:false},
                {icon:"🎟️",name:"Eventos",desc:"Convites e QR Code",active:false},
                {icon:"🏢",name:"Condomínio",desc:"Gestão e aprovações",active:false},
              ].map(m=>(
                <div key={m.name} onClick={()=>m.active&&setScreen("create")}
                  style={{background:"white",borderRadius:16,padding:"18px 16px",cursor:m.active?"pointer":"default",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",opacity:m.active?1:0.55,position:"relative",overflow:"hidden"}}>
                  {!m.active&&<div style={{position:"absolute",top:10,right:10,background:"#E0E4EA",color:"#8896A8",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:100,textTransform:"uppercase"}}>Em breve</div>}
                  <div style={{fontSize:30,marginBottom:10}}>{m.icon}</div>
                  <div style={{fontWeight:800,fontSize:14,color:"#1A202C"}}>{m.name}</div>
                  <div style={{fontSize:12,color:"#8896A8",marginTop:3,lineHeight:1.4}}>{m.desc}</div>
                </div>
              ))}
            </div>
            <div style={{fontWeight:800,fontSize:12,color:"#8896A8",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:14}}>Listas recentes</div>
            {lists.length===0?(
              <div style={{textAlign:"center",padding:"32px 20px",color:"#8896A8"}}>
                <div style={{fontSize:48,marginBottom:12}}>🛒</div>
                <p style={{fontSize:14,lineHeight:1.6}}>Nenhuma lista ainda.<br/>Toque no <strong>+</strong> para criar!</p>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {lists.map(list=>{
                  const ti=list.categories.reduce((s,c)=>s+c.items.length,0);
                  const ci2=list.categories.reduce((s,c)=>s+c.items.filter(i=>i.checked).length,0);
                  const icons={mercado:"🛒",festa:"🎉",construcao:"🏗️",eletrico:"⚡",escolar:"🏫",farmacia:"💊",condominio:"🏢",outros:"📦"};
                  return(
                    <div key={list.id} style={{background:"white",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",overflow:"visible",position:"relative"}}>
                      <div onClick={()=>{setCurrentList(list);setScreen("list");setSearch("");setCollapsedCats({});}}
                        style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",cursor:"pointer"}}>
                        <div style={{fontSize:26,flexShrink:0}}>{icons[list.type]||"📦"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:15,color:"#1A202C",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{list.name}</div>
                          <div style={{fontSize:12,color:"#8896A8",marginTop:2}}>
                            {list.categories.reduce((s,c)=>s+c.items.filter(i=>i.checked).length,0)}/{list.categories.reduce((s,c)=>s+c.items.length,0)} itens · {new Date(list.createdAt).toLocaleDateString("pt-BR")} · {fmtR(list.total||0)}
                          </div>
                        </div>
                        <div style={{color:"#C0C8D4",fontSize:18,flexShrink:0}}>›</div>
                      </div>
                      <div style={{borderTop:"1px solid #F0F2F5",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:12,color:"#8896A8"}}>
                          {list.categories.reduce((s,c)=>s+c.items.filter(i=>i.checked).length,0)}/{list.categories.reduce((s,c)=>s+c.items.length,0)} itens · {fmtR(list.total||0)}
                        </div>
                        <div style={{position:"relative"}}>
                          <button onClick={e=>{e.stopPropagation();setListMenuId(listMenuId===list.id?null:list.id);}}
                            style={{background:"#F0F2F5",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:16,color:"#4A5568",fontFamily:"inherit"}}>⋯</button>
                          {listMenuId===list.id&&(
                            <div style={{position:"absolute",right:0,bottom:42,background:"white",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.22)",border:"1px solid #E0E4EA",zIndex:500,minWidth:210,overflow:"hidden"}}>
                              <button onClick={()=>{setCurrentList(list);setShareModal(true);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#25D366",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>📤 Enviar Lista</button>
                              <div style={{height:1,background:"#F0F2F5"}}/>
                              <button onClick={()=>{setReuseModal(list);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#1A202C",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🔁 Repetir lista</button>
                              <div style={{height:1,background:"#F0F2F5"}}/>
                              <button onClick={()=>{setConfirmDelete(list.id);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#FF4444",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🗑 Excluir lista</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
                          <button onClick={shareAppWhatsApp}
                            style={{width:"100%",padding:"13px 16px",borderRadius:14,background:"#25D366",border:"none",color:"white",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 14px rgba(37,211,102,0.25)"}}>
                            💬 Link do app
                          </button>
                          <button onClick={installApp}
                            style={{width:"100%",padding:"13px 16px",borderRadius:14,background:"white",border:"1px solid #D9DDE6",color:"#4C1D95",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                            📲 Adicionar à Tela de Início
                          </button>
                        </div>
          </div>

        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete&&(
        <ModalSheet onClose={()=>setConfirmDelete(null)}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:48,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:8}}>Excluir lista?</div>
            <div style={{fontSize:14,color:"#8896A8"}}>Essa ação não pode ser desfeita.</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setConfirmDelete(null)} style={{...btnGr,flex:1}}>Cancelar</button>
            <button onClick={()=>deleteList(confirmDelete)} style={{flex:1,padding:14,borderRadius:10,background:"#FF4444",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Excluir</button>
          </div>
        </ModalSheet>
      )}

      {/* ════════════════════════════════════
          CREATE
      ════════════════════════════════════ */}
      {screen==="create"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <div style={{background:"white",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E0E4EA",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>{setScreen("home");setPendingItems([]);setCurrentInput("");}}
              style={{width:36,height:36,borderRadius:"50%",background:"#F0F2F5",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{fontWeight:800,fontSize:18,color:"#1A202C",flex:1,textAlign:"center"}}>{listNameConfirmed&&listName?listName:"Nova lista"}</div>
          </div>
          <div style={{padding:20,flex:1,display:"flex",flexDirection:"column",gap:14,overflowY:"auto",paddingBottom:40}}>
            {/* ORÇAMENTO */}
            <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #E0E4EA"}}>
              <label style={lbl}>💰 Orçamento</label>
              {budgetConfirmed?(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#EDE9FE",borderRadius:10,padding:"10px 14px"}}>
                  <div>
                    <div style={{fontSize:11,color:"#5B21B6",fontWeight:600}}>Limite definido</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#7C3AED"}}>{fmtR(parseBRL(budgetText)||0)}</div>
                  </div>
                  <button onClick={()=>setBudgetConfirmed(false)} style={{background:"none",border:"none",color:"#5B21B6",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Editar</button>
                </div>
              ):(
                <div>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{position:"relative",flex:1}}>
                      <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:700,color:"#8896A8",fontSize:15,pointerEvents:"none"}}>R$</span>
                      <input value={budgetText} onChange={e=>setBudgetText(e.target.value.replace(/[^0-9.,]/g,""))}
                        onKeyDown={e=>e.key==="Enter"&&budgetText&&setBudgetConfirmed(true)}
                        placeholder="0,00" inputMode="decimal"
                        style={inp({paddingLeft:44})}
                        onFocus={e=>e.target.style.borderColor="#7C3AED"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
                    </div>
                    <button onClick={()=>{if(budgetText)setBudgetConfirmed(true);}}
                      style={{padding:"0 18px",borderRadius:10,background:budgetText?"#7C3AED":"#F0F2F5",border:"none",color:budgetText?"white":"#8896A8",fontWeight:700,fontSize:14,cursor:budgetText?"pointer":"default",fontFamily:"inherit",whiteSpace:"nowrap"}}>OK</button>
                  </div>
                  <div style={{fontSize:12,color:"#B0B7C3",marginTop:6}}>Deixe em branco para não definir limite</div>
                </div>
              )}
            </div>
            {/* NOME DA LISTA */}
            <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #E0E4EA"}}>
              <label style={lbl}>📝 Nome da lista</label>
              {listNameConfirmed?(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#EDE9FE",borderRadius:10,padding:"10px 14px"}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#7C3AED"}}>{listName||"Minha lista"}</div>
                  <button onClick={()=>setListNameConfirmed(false)} style={{background:"none",border:"none",color:"#5B21B6",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Editar</button>
                </div>
              ):(
                <div style={{display:"flex",gap:8}}>
                  <input value={listName} onChange={e=>setListName(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&setListNameConfirmed(true)}
                    placeholder="Ex: Compras da semana..."
                    style={inp({flex:1})}
                    onFocus={e=>e.target.style.borderColor="#7C3AED"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
                  <button onClick={()=>setListNameConfirmed(true)}
                    style={{padding:"0 18px",borderRadius:10,background:"#7C3AED",border:"none",color:"white",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
                </div>
              )}
            </div>
            {/* TIPO DE LISTA */}
            <div style={{background:"white",borderRadius:14,padding:16,border:"1px solid #E0E4EA"}}>
              <label style={lbl}>🏷️ Tipo de lista</label>
              <div style={{position:"relative"}}>
                <select value={listType} onChange={e=>setListType(e.target.value)}
                  style={{...inp(),appearance:"none",cursor:"pointer",paddingRight:36}}>
                  {LIST_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#6B7280",fontSize:12}}>▼</span>
              </div>
            </div>
            <div>
              <label style={lbl}>Adicionar itens</label>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={currentInput} onChange={e=>setCurrentInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleAddItem()}
                  placeholder="Nome do produto..."
                  style={inp()} onFocus={e=>e.target.style.borderColor="#7C3AED"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
                <button onClick={handleAddItem}
                  style={{padding:"0 20px",height:52,borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",fontSize:15,fontWeight:800,cursor:"pointer",flexShrink:0,fontFamily:"inherit",whiteSpace:"nowrap"}}>Inserir</button>
              </div>
              <div style={{fontSize:12,color:"#C0C8D4",lineHeight:1.5}}>💡 Para cada produto o app pergunta tipo, tamanho e quantidade.</div>
              <button onClick={()=>setShowPasteModal(true)}
                style={{width:"100%",padding:"14px",borderRadius:12,background:"#F5F3FF",border:"2px solid #7C3AED",color:"#5B21B6",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                📋 Cole sua lista aqui
              </button>
            </div>
            {pendingItems.length>0&&(
              <div style={{background:"white",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
                <div style={{padding:"10px 14px",background:"#F8F9FA",borderBottom:"1px solid #E0E4EA",fontSize:12,fontWeight:700,color:"#8896A8",display:"flex",justifyContent:"space-between"}}>
                  <span>{pendingItems.length} {pendingItems.length===1?"item":"itens"}</span>
                  <button onClick={()=>setPendingItems([])} style={{background:"none",border:"none",color:"#FF4444",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Limpar tudo</button>
                </div>
                {pendingItems.map((item,i)=>{
                  const emb=item.embalagem||"";
                  return(
                    <div key={i} style={{padding:"11px 14px",borderBottom:i<pendingItems.length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:16}}>🛒</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#1A202C",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {[item.qty+" "+item.unit,item.marca,item.tipo,item.name,emb].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button onClick={()=>editPendingItem(i)}
                        style={{background:"#EDE9FE",border:"none",borderRadius:6,padding:"4px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14,marginRight:4}}>✏️</button>
                      <button onClick={()=>setPendingItems(prev=>prev.filter((_,j)=>j!==i))}
                        style={{background:"#FFE8E8",border:"none",borderRadius:6,padding:"4px 10px",color:"#FF4444",cursor:"pointer",fontSize:14}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={organizeList} disabled={loading||pendingItems.length===0}
              style={{...btnG,opacity:(loading||pendingItems.length===0)?0.5:1,cursor:(loading||pendingItems.length===0)?"not-allowed":"pointer"}}>
              ✨ Organizar com IA {pendingItems.length>0&&`(${pendingItems.length} ${pendingItems.length===1?"item":"itens"})`}
            </button>
          </div>
        </div>
      )}

      {/* DIALOG: PRODUTO */}
      {itemDialog&&(
        <ModalSheet onClose={()=>{setItemDialog(null);setEditPendingIdx(null);setCurrentInput("");}}>
          <div style={{fontWeight:900,fontSize:20,color:"#1A202C",marginBottom:4}}>🛒 {itemDialog.name}</div>
          <div style={{fontSize:13,color:"#8896A8",marginBottom:8}}>{dlgLoading?"":editPendingIdx!=null?"Editar item":"Defina os detalhes"}</div>
          {dlgLoading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 0",gap:14}}>
              <div style={{width:40,height:40,borderRadius:"50%",border:"4px solid #E6FAF2",borderTopColor:"#7C3AED",animation:"spin 0.8s linear infinite"}}/>
              <div style={{fontSize:14,color:"#8896A8",fontWeight:600}}>✨ IA classificando...</div>
            </div>
          )}
          {!dlgLoading&&dlgConfig&&(<>

          {/* Tipo */}
          {/* Marca */}
          {dlgConfig.marcas?.length>0&&(
            <div style={{marginBottom:16}}>
              <label style={lbl}>Marca</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <button onClick={()=>setDlgMarca("")} style={chip(dlgMarca==="","#8E24AA","#F3E5F5","#6A1B9A")}>Qualquer</button>
                {dlgConfig.marcas.map(m=><button key={m} onClick={()=>setDlgMarca(m)} style={chip(dlgMarca===m,"#8E24AA","#F3E5F5","#6A1B9A")}>{m}</button>)}
              </div>
            </div>
          )}

          {/* Tipo */}
          {dlgConfig.tipos?.length>0&&(
            <div style={{marginBottom:16}}>
              <label style={lbl}>Tipo / Variação</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <button onClick={()=>setDlgTipo("")} style={chip(dlgTipo==="")}>Qualquer</button>
                {dlgConfig.tipos.map(t=><button key={t} onClick={()=>setDlgTipo(t)} style={chip(dlgTipo===t)}>{t}</button>)}
              </div>
            </div>
          )}

          {/* Peso */}
          {dlgConfig.pesos?.length>0&&(
            <div style={{marginBottom:16}}>
              <label style={lbl}>Peso / Tamanho</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {dlgConfig.pesos.map(p=><button key={p} onClick={()=>setDlgPeso(p)} style={chip(dlgPeso===p,"#1A6B8A","#E8F4F8","#1A6B8A")}>{p}</button>)}
              </div>
            </div>
          )}

          {/* Volume */}
          {dlgConfig.volumes?.length>0&&(
            <div style={{marginBottom:16}}>
              <label style={lbl}>Volume / Embalagem</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {dlgConfig.volumes.map(v=><button key={v} onClick={()=>setDlgVolume(v)} style={chip(dlgVolume===v,"#1A6B8A","#E8F4F8","#1A6B8A")}>{v}</button>)}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div style={{marginBottom:16}}>
            <label style={lbl}>Quantidade</label>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setDlgQty(q=>Math.max(1,q-1))} style={qBtn}>−</button>
              <span style={{fontWeight:900,fontSize:24,color:"#1A202C",minWidth:36,textAlign:"center"}}>{dlgQty}</span>
              <button onClick={()=>setDlgQty(q=>q+1)} style={qBtn}>＋</button>
            </div>
          </div>

          {/* Unidade */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>Unidade de contagem</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {dlgConfig.unidades?.map(u=><button key={u} onClick={()=>setDlgUnit(u)} style={chip(dlgUnit===u,"#6B3FA0","#F3EEF9","#6B3FA0")}>{u}</button>)}
            </div>
          </div>

          {/* Preview */}
          <div style={{background:"#EDE9FE",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13,color:"#6D28D9",fontWeight:700}}>
            ✅ {[dlgQty+" "+dlgUnit, dlgMarca, dlgTipo, itemDialog.name, dlgPeso||dlgVolume].filter(Boolean).join(" · ")}
          </div>

          </>)}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setItemDialog(null);setEditPendingIdx(null);setCurrentInput("");}} style={{...btnGr,flex:1}}>Cancelar</button>
            {!dlgLoading&&(
              <button onClick={confirmDialog}
                style={{flex:2,padding:14,borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
                {editPendingIdx!=null?"Atualizar ✓":"Confirmar ✓"}
              </button>
            )}
          </div>
        </ModalSheet>
      )}

      {/* ════════════════════════════════════
          LIST SCREEN
      ════════════════════════════════════ */}
      {screen==="list"&&currentList&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <div style={{background:"linear-gradient(135deg,#7C3AED,#6D28D9)",padding:"20px 20px 24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <button onClick={()=>setScreen("home")}
                style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
              <div style={{fontWeight:900,fontSize:20,color:"white",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{currentList.name}</div>
              <button onClick={()=>setShareModal(true)}
                style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:100,padding:"6px 16px",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>💬 Enviar Lista</button>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:15,color:"white"}}>{fmtR(fullTotal)}</span>
                {budget>0&&<span style={{fontWeight:800,fontSize:15,color:"rgba(255,255,255,0.8)"}}>{fmtR(budget)}</span>}
              </div>
              <div style={{height:10,background:"rgba(255,255,255,0.2)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",background:pct<50?"#34D399":pct<80?"#FBBF24":"#F87171",borderRadius:5,width:pct+"%",transition:"width 0.4s, background 0.6s"}}/>
              </div>
              <div style={{textAlign:"center",fontSize:13,fontWeight:700}}>
                {budget>0?(
                  <span style={{color:budgetDiff<0?"#FCA5A5":"rgba(255,255,255,0.9)"}}>
                    {budgetDiff<0?"⚠️ Acima em "+fmtR(Math.abs(budgetDiff)):"Saldo: "+fmtR(budgetDiff)}
                  </span>
                ):(
                  <span style={{color:"rgba(255,255,255,0.75)",fontSize:12}}>{checkedItems}/{totalItems} itens</span>
                )}
              </div>
            </div>
          </div>

          {/* Painel orçamento excedido */}
          {budget>0&&budgetDiff!==null&&budgetDiff<0&&(
            <div style={{margin:"10px 20px 0",background:"#FEF2F2",borderRadius:14,border:"2px solid #EF4444",overflow:"hidden"}}>
              <div onClick={()=>setShowSuggestions(s=>!s)}
                style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <span style={{fontSize:18}}>⚠️</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#B91C1C"}}>Acima do orçamento em {fmtR(Math.abs(budgetDiff))}</div>
                  <div style={{fontSize:12,color:"#EF4444",marginTop:1}}>Toque para ver sugestões de ajuste</div>
                </div>
                <span style={{fontSize:12,color:"#EF4444",transform:showSuggestions?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",display:"inline-block"}}>▾</span>
              </div>
              {showSuggestions&&(()=>{
                const suggs=getSuggestions();
                if(suggs.length===0)return <div style={{padding:"8px 14px 14px",fontSize:13,color:"#B91C1C"}}>Nenhum item comprado ainda para sugerir ajuste.</div>;
                return(
                  <div style={{borderTop:"1px solid #FECACA"}}>
                    <div style={{padding:"8px 14px 4px",fontSize:11,fontWeight:700,color:"#B91C1C",textTransform:"uppercase",letterSpacing:"0.5px"}}>
                      Plano de ajuste até voltar ao orçamento
                    </div>
                    {suggs.map(({ci,ii,name,qty,price,tipo,catName},i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderTop:"1px solid #FECACA",background:"white"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{fontWeight:700,fontSize:14,color:"#1A202C",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                            {tipo==="remover"&&<span style={{fontSize:10,fontWeight:700,background:"#FEF2F2",color:"#B91C1C",padding:"2px 6px",borderRadius:100,border:"1px solid #FECACA",flexShrink:0}}>supérfluo</span>}
                          </div>
                          <div style={{fontSize:12,color:"#8896A8",marginTop:2}}>
                            {tipo==="reduzir"?`${qty} un · reduzir 1 un economiza ${fmtR(price)}`:`remover economiza ${fmtR(price*qty)}`}
                          </div>
                        </div>
                        {tipo==="reduzir"?(
                          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                            <button onClick={()=>quickAdjust(ci,ii,-1)}
                              style={{width:30,height:30,borderRadius:"50%",border:"2px solid #EF4444",background:"#FEF2F2",color:"#EF4444",fontWeight:900,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>−</button>
                            <span style={{fontWeight:800,fontSize:14,minWidth:18,textAlign:"center"}}>{qty}</span>
                            <button onClick={()=>quickAdjust(ci,ii,1)}
                              style={{width:30,height:30,borderRadius:"50%",border:"2px solid #7C3AED",background:"#EDE9FE",color:"#5B21B6",fontWeight:900,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>+</button>
                          </div>
                        ):(
                          <button onClick={()=>{
                            const l=JSON.parse(JSON.stringify(currentList));
                            l.categories[ci].items.splice(ii,1);
                            if(l.categories[ci].items.length===0)l.categories.splice(ci,1);
                            updateList(l);setSearch("");setTimeout(scrollToListTop,100);showToast("🗑 "+name+" removido");
                          }}
                            style={{padding:"6px 12px",borderRadius:8,border:"2px solid #EF4444",background:"#FEF2F2",color:"#B91C1C",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                            🗑 Remover
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{padding:"6px 14px 8px",fontSize:11,color:"#EF4444",fontStyle:"italic"}}>
                      As sugestões continuam aparecendo até o total voltar ao orçamento programado
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Search */}
          <div style={{margin:"14px 20px 0",position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#C0C8D4"}}>🔍</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar item na lista..."
              style={{...inp({padding:"12px 16px 12px 42px",borderRadius:100})}}
              onFocus={e=>e.target.style.borderColor="#7C3AED"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
            {search&&(
              <button onClick={()=>{setSearch("");searchRef.current?.focus();}}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#8896A8",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            )}
          </div>

          {/* Categorias com cores */}
          <div ref={listRef} style={{flex:1,padding:"14px 20px 110px",overflowY:"auto"}}>
            {[...currentList.categories]
              .map((cat,origIdx)=>({cat,origIdx}))
              .sort((a,b)=>{
                const aDone=a.cat.items.length>0&&a.cat.items.every(i=>i.checked||i.notFound);
                const bDone=b.cat.items.length>0&&b.cat.items.every(i=>i.checked||i.notFound);
                if(aDone===bDone)return a.origIdx-b.origIdx;
                return aDone?1:-1;
              })
              .map(({cat,origIdx:ci})=>{
              const theme=getCatTheme(cat.name);
              const done=cat.items.filter(i=>i.checked).length;
              const total=cat.items.length;
              const allDone=done===total&&total>0;
              const sub=getCatSubtotal(cat);
              const isCollapsed=collapsedCats[ci];
              const filtered=search?cat.items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())):cat.items;
              if(search&&filtered.length===0)return null;

              return(
                <div key={ci} style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:`2px solid ${allDone?"#7C3AED":theme.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"border-color 0.3s"}}>
                  {/* Cabeçalho colorido da categoria */}
                  <div onClick={()=>setCollapsedCats(p=>({...p,[ci]:!p[ci]}))}
                    style={{background:allDone?"#E8F5E9":theme.bg,padding:"12px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none",borderBottom:isCollapsed?"none":`1px solid ${theme.border}40`}}>
                    <span style={{fontSize:20}}>{theme.icon}</span>
                    <span style={{fontWeight:800,fontSize:14,color:allDone?"#2E7D32":theme.header,flex:1}}>
                      {cat.name}
                      {allDone&&<span style={{marginLeft:8,fontSize:12,color:"#43A047"}}>✓ Completo</span>}
                    </span>
                    {sub>0&&<span style={{fontSize:13,fontWeight:800,color:allDone?"#2E7D32":theme.header}}>{fmtR(sub)}</span>}
                    <span style={{fontSize:12,color:allDone?"#43A047":theme.header,fontWeight:700,opacity:0.7,marginLeft:4}}>{done}/{total}</span>
                    <span style={{fontSize:12,color:theme.header,opacity:0.6,transition:"transform 0.2s",display:"inline-block",transform:isCollapsed?"rotate(-90deg)":"rotate(0)"}}>▾</span>
                  </div>

                  {/* Itens da categoria */}
                  {!isCollapsed&&(
                    <div style={{background:allDone?"#F9FFF9":"white",display:"flex",flexDirection:"column"}}>
                      {(search?filtered:cat.items).map((item,ii)=>{
                        const isExtra=cat.name==="Itens Extras";
                        const hl=search&&item.name.toLowerCase().includes(search.toLowerCase());
                        const realII=search?cat.items.findIndex(it=>it===item):ii;
                        const isLast=(search?filtered:cat.items).length-1===ii;

                        // Monta descrição e linha de preço
                        const descLine=[item.name,item.detail].filter(Boolean).join(" ");
                        const hasPrice=item.price!=null;
                        const totalItemPrice=hasPrice?fmtR(item.price*item.qty):"";
                        let priceLine="";
                        if(hasPrice){
                          priceLine=item.qty>1?`${item.qty} ${item.unit} × ${fmtR(item.price)}`:`1 ${item.unit} × ${fmtR(item.price)}`;
                        } else {
                          priceLine=item.qty>1?`${item.qty} ${item.unit}`:`${item.unit}`;
                        }

                        return(
                          <div key={ii}
                            onClick={()=>{openItemModal(ci,realII);if(search)setSearch("");}}
                            style={{
                              display:"flex",alignItems:"center",gap:12,
                              padding:"13px 14px",
                              borderBottom:isLast?"none":`1px solid ${theme.bg}`,
                              background:hl?"#FFFDE7":item.checked?theme.bg+"80":"white",
                              opacity:(item.checked||item.notFound)?0.65:1,cursor:"pointer",
                              transition:"background 0.15s",
                            }}>
                            {/* Checkbox com cor da categoria */}
                            <div onClick={e=>{e.stopPropagation();toggleCheck(ci,realII);if(search)setSearch("");}}
                              style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${item.checked?theme.border:"#E0E4EA"}`,background:item.checked?theme.border:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,color:"white",cursor:"pointer",transition:"all 0.2s"}}>
                              {item.checked?"✓":""}
                            </div>
                            {/* Conteúdo */}
                            <div style={{flex:1,minWidth:0}}>
                              {/* Linha 1: descrição */}
                              <div style={{fontWeight:700,fontSize:15,color:(item.checked||item.notFound)?"#9E9E9E":"#1A202C",textDecoration:(item.checked||item.notFound)?"line-through":"none",textDecorationColor:item.checked&&!item.notFound?"#EF4444":"inherit",textDecorationThickness:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                                {descLine}
                                {isExtra&&<span style={{fontSize:10,fontWeight:700,background:"#FF7043",color:"white",padding:"2px 6px",borderRadius:100,textTransform:"uppercase",flexShrink:0}}>extra</span>}
                                {item.notFound&&<span style={{fontSize:10,fontWeight:700,background:"#EF4444",color:"white",padding:"2px 6px",borderRadius:100,textTransform:"uppercase",flexShrink:0}}>não encontrado</span>}
                              </div>
                              {/* Linha 2: qty × preço = total */}
                              <div style={{fontSize:12,marginTop:4,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                                <span style={{color:"#8896A8"}}>{priceLine}</span>
                                {hasPrice?(
                                  <span style={{fontWeight:800,fontSize:14,color:item.checked?"#9E9E9E":theme.header,flexShrink:0}}>{totalItemPrice}</span>
                                ):(
                                  <span style={{fontSize:12,color:"#C0C8D4",flexShrink:0}}>+ preço</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={()=>setExtraModal(true)}
            style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",borderRadius:100,padding:"14px 24px",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 24px rgba(124,58,237,0.4)",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap",zIndex:200,fontFamily:"inherit"}}>
            ＋ Adicionar item extra
          </button>
        </div>
      )}

      {/* MODAL: ITEM */}
      {itemModal&&currentList&&(()=>{
        const item=currentList.categories[itemModal.ci]?.items[itemModal.ii];
        if(!item)return null;
        const theme=getCatTheme(currentList.categories[itemModal.ci]?.name);
        return(
          <ModalSheet onClose={()=>setItemModal(null)}>
            <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:4}}>{[item.name,item.detail].filter(Boolean).join(" ")}</div>
            <div style={{fontSize:13,color:"#8896A8",marginBottom:20}}>{currentList.categories[itemModal.ci]?.name}</div>
            {/* Nao encontrado toggle */}
            <div style={{display:"flex",alignItems:"center",gap:12,background:mNotFound?"#FEF2F2":"#F8F9FA",borderRadius:12,padding:"12px 14px",marginBottom:16,cursor:"pointer"}}
              onClick={()=>setMNotFound(!mNotFound)}>
              <div style={{width:28,height:28,borderRadius:"50%",border:"2.5px solid "+(mNotFound?"#EF4444":"#E0E4EA"),background:mNotFound?"#FEE2E2":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>
                {mNotFound?"✗":""}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:mNotFound?"#EF4444":"#1A202C"}}>Item não encontrado / em falta</div>
                <div style={{fontSize:12,color:"#8896A8"}}>Marcar como indisponível na loja</div>
              </div>
            </div>

            {!mNotFound&&<>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Quantidade</label>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <button onClick={()=>setMQty(q=>Math.max(1,q-1))} style={qBtn}>−</button>
                <span style={{fontWeight:900,fontSize:24,color:"#1A202C",minWidth:36,textAlign:"center"}}>{mQty}</span>
                <button onClick={()=>setMQty(q=>q+1)} style={qBtn}>＋</button>
                <span style={{fontSize:14,color:"#8896A8",marginLeft:4}}>{item.unit||"un"}</span>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>Preço unitário</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:700,color:"#8896A8",fontSize:16,pointerEvents:"none"}}>R$</span>
                <input value={mPriceText} onChange={e=>setMPriceText(e.target.value.replace(/[^0-9.,]/g,""))}
                  placeholder="0,00" inputMode="decimal"
                  style={inp({paddingLeft:44})}
                  onFocus={e=>e.target.style.borderColor=theme.border} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
              </div>
              {mPriceText&&parseBRL(mPriceText)!=null&&(
                <div style={{fontSize:13,fontWeight:700,marginTop:8,color:theme.header}}>
                  Total: {fmtR((parseBRL(mPriceText)||0)*mQty)}
                </div>
              )}
            </div>
            </>}

            <div style={{display:"flex",gap:10}}>
              <button onClick={removeItem} style={{padding:"14px 18px",borderRadius:10,background:"#FFE8E8",border:"none",color:"#FF4444",fontWeight:700,fontSize:16,cursor:"pointer"}}>🗑</button>
              <button onClick={confirmItem}
                disabled={!mNotFound&&!mPriceText.trim()}
                style={{flex:1,padding:14,borderRadius:10,background:mNotFound?"#EF4444":`linear-gradient(135deg,${theme.border},${theme.header})`,border:"none",color:"white",fontWeight:800,fontSize:15,fontFamily:"inherit",opacity:(!mNotFound&&!mPriceText.trim())?0.5:1,cursor:(!mNotFound&&!mPriceText.trim())?"not-allowed":"pointer"}}>
                {mNotFound?"✗ Não encontrado":!mPriceText.trim()?"Informe o preço":"✓ Confirmar"}
              </button>
            </div>
          </ModalSheet>
        );
      })()}

      {/* MODAL: EXTRA */}
      {extraModal&&(
        <ModalSheet onClose={()=>setExtraModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:4}}>⭐ Item extra</div>
          <div style={{fontSize:13,color:"#8896A8",marginBottom:20}}>Fora da lista original — ficará destacado em laranja</div>
          <div style={{marginBottom:10}}>
            <label style={lbl}>Produto</label>
            <div style={{display:"flex",gap:8}}>
              <input value={exName} onChange={e=>setExName(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&exName.trim()){openProductDialog(exName.trim());setExtraModal(false);}}}
                placeholder="Nome do produto..."
                style={inp()} onFocus={e=>e.target.style.borderColor="#FF7043"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
              <button onClick={()=>{if(exName.trim()){openProductDialog(exName.trim());setExtraModal(false);}}}
                disabled={!exName.trim()}
                style={{padding:"0 16px",borderRadius:10,background:exName.trim()?"#FF7043":"#F0F2F5",border:"none",color:exName.trim()?"white":"#8896A8",fontSize:14,fontWeight:800,cursor:exName.trim()?"pointer":"default",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>
                Inserir IA
              </button>
            </div>
            <div style={{fontSize:12,color:"#E65100",marginTop:6,background:"#FFF3E0",borderRadius:8,padding:"6px 10px"}}>
              💡 A IA vai sugerir marca, tipo e tamanho antes de adicionar.
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{flex:1}}>
              <label style={lbl}>Quantidade</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setExQty(q=>Math.max(1,q-1))} style={{...qBtn,width:38,height:38,fontSize:18}}>−</button>
                <span style={{fontWeight:800,fontSize:20,minWidth:28,textAlign:"center"}}>{exQty}</span>
                <button onClick={()=>setExQty(q=>q+1)} style={{...qBtn,width:38,height:38,fontSize:18}}>＋</button>
              </div>
            </div>
            <div style={{flex:1}}>
              <label style={lbl}>Unidade</label>
              <select value={exUnit} onChange={e=>setExUnit(e.target.value)} style={{...inp(),padding:"10px 12px",height:44}}>
                {["unidade","pacote","caixa","kg","g","L","ml","fardo","lata","garrafa","dúzia","par","peça"].map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Preço (R$) — opcional</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:700,color:"#8896A8",fontSize:16,pointerEvents:"none"}}>R$</span>
              <input value={exPrice} onChange={e=>setExPrice(e.target.value.replace(/[^0-9.,]/g,""))} placeholder="0,00" inputMode="decimal"
                style={inp({paddingLeft:44})} onFocus={e=>e.target.style.borderColor="#FF7043"} onBlur={e=>e.target.style.borderColor="#E0E4EA"}/>
            </div>
          </div>
          <button onClick={addExtra} style={btnG}>＋ Adicionar à lista</button>
        </ModalSheet>
      )}

      {/* MODAL: SHARE */}
      {shareModal&&(
        <ModalSheet onClose={()=>setShareModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:4,textAlign:"center"}}>Compartilhar lista</div>
          <div style={{fontSize:13,color:"#8896A8",marginBottom:16,textAlign:"center"}}>Escolha como enviar</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={()=>{setShareModal(false);shareWhatsApp();}}
              style={{width:"100%",padding:16,borderRadius:12,background:"#25D366",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={()=>{setShareModal(false);shareTelegram();}}
              style={{width:"100%",padding:16,borderRadius:12,background:"#0088CC",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </button>
            <button onClick={()=>{setShareModal(false);shareOtherApps();}}
              style={{width:"100%",padding:16,borderRadius:12,background:"#7C3AED",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              🛍️ Outros apps / Copiar
            </button>
          </div>
        </ModalSheet>
      )}


      {checkPopup&&currentList&&(()=>{
        const item=currentList.categories[checkPopup.ci]?.items[checkPopup.ii];
        if(!item)return null;
        return(
          <div onClick={()=>setCheckPopup(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:20,padding:24,maxWidth:320,width:"100%",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🛒</div>
              <div style={{fontWeight:800,fontSize:17,color:"#1A202C",marginBottom:6}}>{item.name}</div>
              <div style={{fontSize:14,color:"#8896A8",marginBottom:20}}>Deseja inserir o preço deste item?</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>{
                  const l=JSON.parse(JSON.stringify(currentList));
                  l.categories[checkPopup.ci].items[checkPopup.ii].checked=true;
                  updateList(l);setCheckPopup(null);setSearch("");
                  setTimeout(scrollToListTop,100);
                  const allDone=l.categories.every(c=>c.items.every(i=>i.checked||i.notFound));
                  if(allDone&&l.categories.reduce((s,c)=>s+c.items.length,0)>0)setTimeout(()=>setShowFinished(true),400);
                }} style={{flex:1,padding:14,borderRadius:12,background:"#F0F2F5",border:"none",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",color:"#4A5568"}}>Não</button>
                <button onClick={()=>{setCheckPopup(null);openItemModal(checkPopup.ci,checkPopup.ii);}}
                  style={{flex:1,padding:14,borderRadius:12,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Sim</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: COLAR TEXTO ── */}
      {showPasteModal&&(
        <ModalSheet onClose={()=>setShowPasteModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:4}}>📋 Colar lista de texto</div>
          <div style={{fontSize:13,color:"#8896A8",marginBottom:12}}>Cole sua lista — uma linha por item:</div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"- Arroz\n- Feijão\n- Leite\n- Detergente"}
            style={{width:"100%",padding:"13px 16px",border:"2px solid #E0E4EA",borderRadius:12,fontSize:15,color:"#1A202C",outline:"none",fontFamily:"inherit",background:"white",boxSizing:"border-box",height:200,resize:"none",marginBottom:16}}/>
          <button onClick={parsePastedText} disabled={!pasteText.trim()}
            style={{...btnG,opacity:pasteText.trim()?1:0.5,cursor:pasteText.trim()?"pointer":"not-allowed"}}>
            ✅ Importar itens
          </button>
        </ModalSheet>
      )}

      {/* ── MODAL: REUTILIZAR LISTA ── */}
      {reuseModal&&(
        <ModalSheet onClose={()=>setReuseModal(null)}>
          <div style={{fontWeight:900,fontSize:18,color:"#1A202C",marginBottom:4}}>🔁 Repetir lista</div>
          <div style={{fontSize:13,color:"#8896A8",marginBottom:16,textAlign:"center"}}>Escolha a lista base:</div>
          <div style={{background:"#F0F2F5",borderRadius:12,padding:12,marginBottom:16,maxHeight:200,overflowY:"auto"}}>
            {lists.map(l=>(
              <button key={l.id} onClick={()=>setReuseModal(l)}
                style={{width:"100%",padding:"10px 14px",border:"none",background:reuseModal.id===l.id?"#EDE9FE":"none",borderRadius:10,textAlign:"left",fontSize:14,fontWeight:reuseModal.id===l.id?700:500,color:reuseModal.id===l.id?"#5B21B6":"#1A202C",cursor:"pointer",display:"flex",gap:10,marginBottom:4,fontFamily:"inherit"}}>
                <span>{({mercado:"🛒",hortifruti:"🥬",farmacia:"💊",construcao:"🏗️",eletrico:"⚡",escolar:"🏫",eventos:"🎉",outros:"📦"})[l.type]||"📦"}</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
              </button>
            ))}
          </div>
          <button onClick={()=>reuseList(reuseModal)} style={{...btnG}}>🔁 Usar como base</button>
        </ModalSheet>
      )}

    </div>
  );
}

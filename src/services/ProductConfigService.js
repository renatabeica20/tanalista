// Serviço de configuração de produtos, categorias e temas visuais do Tá na Lista.
// Extraído do App.jsx para reduzir o tamanho do componente principal.

function normalizePlainText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const CAT_THEME = {
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



// ── HORTIFRUTI: PESO MÉDIO ESTIMADO POR UNIDADE ─────────────────────────
// Base aproximada para quando o usuário informa itens vendidos por kg em unidades.
// O app sempre apresenta como estimativa e permite ajuste manual do peso real.
export const HORTIFRUTI_UNIT_WEIGHT = {
  batata: { avgKg: 0.18, minKg: 0.12, maxKg: 0.25, aliases: ["batata inglesa", "batata comum"] },
  "batata doce": { avgKg: 0.25, minKg: 0.15, maxKg: 0.45, aliases: ["batata-doce"] },
  tomate: { avgKg: 0.12, minKg: 0.08, maxKg: 0.18, aliases: ["tomate comum", "tomate salada"] },
  cebola: { avgKg: 0.15, minKg: 0.09, maxKg: 0.22, aliases: ["cebola branca", "cebola roxa"] },
  cenoura: { avgKg: 0.10, minKg: 0.07, maxKg: 0.16, aliases: [] },
  pimentao: { avgKg: 0.16, minKg: 0.10, maxKg: 0.25, aliases: ["pimentão", "pimentao verde", "pimentão verde", "pimentao vermelho", "pimentão vermelho", "pimentao amarelo", "pimentão amarelo"] },
  pepino: { avgKg: 0.22, minKg: 0.15, maxKg: 0.35, aliases: ["pepino japones", "pepino japonês"] },
  abobrinha: { avgKg: 0.25, minKg: 0.18, maxKg: 0.40, aliases: [] },
  chuchu: { avgKg: 0.35, minKg: 0.25, maxKg: 0.50, aliases: [] },
  beterraba: { avgKg: 0.18, minKg: 0.12, maxKg: 0.28, aliases: [] },
  mandioca: { avgKg: 0.45, minKg: 0.25, maxKg: 0.80, aliases: ["aipim", "macaxeira"] },
  alho: { avgKg: 0.05, minKg: 0.03, maxKg: 0.08, aliases: ["cabeça de alho", "cabeca de alho"] },
  berinjela: { avgKg: 0.30, minKg: 0.20, maxKg: 0.45, aliases: [] },
  abobora: { avgKg: 1.00, minKg: 0.50, maxKg: 2.50, aliases: ["abóbora", "moranga"] },

  banana: { avgKg: 0.12, minKg: 0.08, maxKg: 0.16, aliases: ["banana prata", "banana nanica", "banana caturra", "banana maca", "banana maçã"] },
  maca: { avgKg: 0.15, minKg: 0.11, maxKg: 0.22, aliases: ["maçã", "maca gala", "maçã gala", "maca fuji", "maçã fuji"] },
  laranja: { avgKg: 0.18, minKg: 0.13, maxKg: 0.25, aliases: ["laranja pera", "laranja pêra", "laranja bahia"] },
  limao: { avgKg: 0.08, minKg: 0.05, maxKg: 0.12, aliases: ["limão", "limao tahiti", "limão tahiti"] },
  pera: { avgKg: 0.16, minKg: 0.12, maxKg: 0.23, aliases: ["pêra"] },
  manga: { avgKg: 0.35, minKg: 0.25, maxKg: 0.60, aliases: ["manga tommy", "manga palmer"] },
  mamao: { avgKg: 0.80, minKg: 0.50, maxKg: 1.30, aliases: ["mamão", "mamao papaia", "mamão papaia", "mamao formosa", "mamão formosa"] },
  abacate: { avgKg: 0.45, minKg: 0.25, maxKg: 0.80, aliases: [] },
  abacaxi: { avgKg: 1.20, minKg: 0.90, maxKg: 1.80, aliases: [] },
  melancia: { avgKg: 5.00, minKg: 3.00, maxKg: 8.00, aliases: [] },
  melao: { avgKg: 1.50, minKg: 1.00, maxKg: 2.30, aliases: ["melão"] },
  uva: { avgKg: 0.50, minKg: 0.30, maxKg: 0.80, aliases: ["cacho de uva", "uva verde", "uva roxa"] },
  kiwi: { avgKg: 0.08, minKg: 0.06, maxKg: 0.12, aliases: [] },

  alface: { avgKg: 0.35, minKg: 0.25, maxKg: 0.50, aliases: ["pé de alface", "pe de alface"] },
  couve: { avgKg: 0.25, minKg: 0.15, maxKg: 0.35, aliases: ["maço de couve", "maco de couve"] },
  brocolis: { avgKg: 0.35, minKg: 0.25, maxKg: 0.50, aliases: ["brócolis"] },
  couveFlor: { avgKg: 0.60, minKg: 0.40, maxKg: 0.90, aliases: ["couve flor", "couve-flor"] },
  repolho: { avgKg: 1.00, minKg: 0.70, maxKg: 1.50, aliases: [] }
};

export function getHortifrutiUnitWeightInfo(productName) {
  const clean = normalizePlainText(productName || "");
  if (!clean) return null;
  for (const [key, info] of Object.entries(HORTIFRUTI_UNIT_WEIGHT)) {
    const aliases = [key, ...(Array.isArray(info.aliases) ? info.aliases : [])].map(normalizePlainText);
    if (aliases.some(alias => alias && (clean === alias || clean.includes(alias) || alias.includes(clean)))) {
      return { key, ...info };
    }
  }
  return null;
}

export function getEstimatedProduceWeight(item) {
  const unit = normalizePlainText(item?.unit || "unidade");
  if (!["unidade", "un", "unid", "und", "peca", "peça"].includes(unit)) return null;
  const qty = Number(String(item?.qty ?? 1).replace(",", "."));
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const info = getHortifrutiUnitWeightInfo(item?.name || "");
  if (!info) return null;
  return {
    ...info,
    qty,
    estimatedKg: Number((qty * info.avgKg).toFixed(3)),
    minTotalKg: Number((qty * info.minKg).toFixed(3)),
    maxTotalKg: Number((qty * info.maxKg).toFixed(3)),
  };
}

export function getCatTheme(name) {
  return CAT_THEME[name] || { bg:"#FAFAFA", border:"#BDBDBD", header:"#424242", icon:"📦" };
}

export function hexToRgba(hex, alpha = 1) {
  try {
    const clean = String(hex || "").replace("#", "");
    const value = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
    const num = parseInt(value, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(17,24,39,${alpha})`;
  }
}

export function getPremiumSectionStyle(theme, { isExtraCat = false, allDone = false, listThemeSoft = null } = {}) {
  const border = isExtraCat ? "#F97316" : allDone ? "#22C55E" : theme.border;
  // Fundo levemente tingido com a cor do tipo de lista (10% de opacidade)
  // Mantém o branco como base para não comprometer a leitura
  const bgBase = listThemeSoft && !isExtraCat && !allDone
    ? `linear-gradient(180deg, #FFFFFF 0%, ${listThemeSoft} 100%)`
    : "rgba(255,255,255,0.96)";
  return {
    marginBottom: 18,
    borderRadius: 22,
    overflow: "hidden",
    border: `1.5px solid ${hexToRgba(border, 0.58)}`,
    background: bgBase,
    boxShadow: `0 18px 42px ${hexToRgba(border, 0.12)}, 0 2px 8px rgba(15,23,42,0.05)`,
    transition: "border-color 0.25s, box-shadow 0.25s, transform 0.18s, background 0.4s",
  };
}

export function getPremiumSectionHeaderStyle(theme, { isExtraCat = false, allDone = false, isCollapsed = false } = {}) {
  const base = isExtraCat ? "#F97316" : allDone ? "#22C55E" : theme.border;
  return {
    background: `linear-gradient(135deg, ${hexToRgba(base, 0.14)}, ${hexToRgba(base, 0.055)})`,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
    borderBottom: isCollapsed ? "none" : `1px solid ${hexToRgba(base, 0.18)}`,
  };
}

function getProductConfigBase(name) {
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

  if (/\bmamão\b|\bmamao\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Formosa","Papaya","Havaí"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  if (/\bmanga\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Tommy","Palmer","Espada","Rosa"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  if (/\buva\b/.test(n))
    return {
      marcas:["Produção regional","Importada","Orgânico"],
      tipos:["Thompson","Niágara","Rubi","Vitória","Sem semente"],
      pesos:[],
      unidades:["kg","bandeja","cacho"]
    };

  if (/\bmelão\b|\bmelao\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Amarelo","Cantaloupe","Gália","Orange"],
      pesos:[],
      unidades:["kg","unidade","metade"]
    };

  if (/\babacaxi\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Pérola","Havaí"],
      pesos:[],
      unidades:["unidade","kg"]
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

  if (/len[cç]o[s]?\s*umedecido[s]?|lenco[s]?\s*umedecido[s]?|umedecido[s]?/.test(n))
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

// ── REGRAS INTELIGENTES DE PREÇO / UNIDADE ──────────────────────────────
// Camada de segurança adicionada para evitar que produtos de pacote, fardo,
// caixa, garrafa, lata ou unidade sejam tratados indevidamente como preço por kg.
// A função original foi preservada como getProductConfigBase(name) e esta função
// exportada aplica os ajustes finais usados pelo app.

const KG_ALLOWED_PATTERNS = [
  // Hortifruti vendido normalmente por peso
  /tomate|cebola|batata|cenoura|limao|banana|maca|laranja|mamao|manga|uva|melao|abacaxi|abacate|melancia/i,
  /chuchu|abobrinha|pimentao|jilo|berinjela|mandioca|abobora|pepino|beterraba|brocolis|couve|repolho/i,

  // Carnes, aves e peixes
  /carne|picanha|alcatra|fraldinha|contra.?file|file mignon|maminha|coxao|patinho|acem|musculo|paleta|costela|cupim/i,
  /frango|peixe|salmao|tilapia|linguica|calabresa/i,

  // Frios e embutidos que podem ser comprados por peso no balcão
  /queijo|presunto|mortadela|salame|peito de peru/i,
];

const KG_BLOCKED_PATTERNS = [
  // Mercearia seca / pacotes
  /cafe|cha|arroz|feijao|macarrao|massa|acucar|farinha|sal|fuba|pipoca|aveia|granola|cereal/i,
  /leite condensado|creme de leite|achocolatado|nescau|toddy|chocolate em po/i,

  // Bebidas e líquidos alimentícios
  /leite|oleo|azeite|vinagre|refrigerante|cerveja|vinho|vodka|whisky|whiskey|gin|rum|cachaca|suco|nectar|agua|energetico/i,

  // Snacks, doces e industrializados
  /biscoito|bolacha|chocolate|salgadinho|batata chips|doritos|ruffles|fandangos|cheetos|sorvete|nugget|empanado|pizza|lasanha/i,

  // Limpeza
  /detergente|amaciante|desinfetante|agua sanitaria|multiuso|limpa vidro|sabao em po|sabao liquido|alcool/i,
  /esponja|palha de aco|vassoura|rodo|mop|saco de lixo/i,

  // Higiene e perfumaria
  /shampoo|condicionador|sabonete|creme dental|pasta de dente|desodorante|fio dental|escova|absorvente|fralda|lenco/i,
  /protetor solar|filtro solar|creme para cabelo|mascara capilar/i,

  // Papelaria / descartáveis / construção / elétrico
  /papel higienico|papel toalha|guardanapo|copo descartavel|prato descartavel|talher descartavel/i,
  /papel aluminio|papel filme|embalagem|marmita|pote descartavel|palito/i,
  /cimento|argamassa|tinta|lampada|fio|cabo eletrico|disjuntor/i,
];

const LIQUID_PATTERNS = [
  /leite|oleo|azeite|vinagre|refrigerante|cerveja|vinho|vodka|whisky|whiskey|gin|rum|cachaca|suco|nectar|agua|energetico/i,
  /detergente|amaciante|desinfetante|agua sanitaria|multiuso|limpa vidro|sabao liquido|alcool|shampoo|condicionador/i,
];

const PACKAGE_HINT_PATTERNS = [
  /cafe|cha|arroz|feijao|macarrao|massa|acucar|farinha|sal|fuba|pipoca|aveia|granola|cereal/i,
  /biscoito|bolacha|salgadinho|batata chips|doritos|ruffles|fandangos|cheetos/i,
  /sabao em po|papel higienico|papel toalha|guardanapo|fralda|absorvente/i,
];

function isKgAllowedByName(name) {
  const n = normalizePlainText(name || "");
  if (!n) return false;
  if (KG_BLOCKED_PATTERNS.some((regex) => regex.test(n))) return false;
  return KG_ALLOWED_PATTERNS.some((regex) => regex.test(n));
}

function isLiquidByName(name) {
  const n = normalizePlainText(name || "");
  return LIQUID_PATTERNS.some((regex) => regex.test(n));
}

function hasPackageHintByName(name) {
  const n = normalizePlainText(name || "");
  return PACKAGE_HINT_PATTERNS.some((regex) => regex.test(n));
}

function removeKgUnits(unidades = []) {
  return (Array.isArray(unidades) ? unidades : []).filter((unit) => {
    const clean = normalizePlainText(unit);
    return !["kg", "quilo", "quilograma", "g", "grama", "gramas"].includes(clean);
  });
}

function uniqueList(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizePlainText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function enhanceProductConfig(name, config = {}) {
  const allowPriceByKg = isKgAllowedByName(name);
  const isLiquid = isLiquidByName(name);
  const hasPackageHint = hasPackageHintByName(name);

  const safeConfig = {
    marcas: [],
    tipos: [],
    pesos: [],
    volumes: [],
    unidades: ["unidade"],
    ...config,
  };

  let unidades = allowPriceByKg
    ? Array.isArray(safeConfig.unidades) ? safeConfig.unidades : ["kg", "unidade"]
    : removeKgUnits(safeConfig.unidades);

  if (!unidades.length) {
    if (isLiquid) {
      unidades = ["unidade", "frasco", "garrafa", "fardo"];
    } else if (hasPackageHint) {
      unidades = ["pacote", "caixa", "fardo", "unidade"];
    } else {
      unidades = ["unidade", "pacote", "caixa"];
    }
  }

  // Para líquidos, reforça opções úteis sem permitir kg.
  if (isLiquid && !allowPriceByKg) {
    unidades = uniqueList([...unidades, "unidade", "garrafa", "frasco", "fardo"]);
  }

  // Para itens de pacote, reforça pacote/caixa/fardo e mantém a ordem amigável.
  if (hasPackageHint && !allowPriceByKg) {
    unidades = uniqueList(["pacote", ...unidades, "caixa", "fardo", "unidade"]);
  }

  return {
    ...safeConfig,
    unidades: uniqueList(unidades),
    allowPriceByKg,
    isLiquid,
    defaultPriceMode: allowPriceByKg ? "kg" : "unit",
  };
}

export function getProductConfig(name) {
  return enhanceProductConfig(name, getProductConfigBase(name));
}


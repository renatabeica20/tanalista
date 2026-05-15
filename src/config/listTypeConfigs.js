export const LIST_TYPE_CONFIGS = {
  mercado: {
    id: "mercado",
    label: "Supermercado",
    icon: "🛒",
    placeholder: "Digite itens de supermercado, como arroz, leite, carne...",
    defaultUnit: "unidade",
    units: ["unidade", "pacote", "kg", "litro", "caixa", "fardo", "garrafa", "lata"],
    categories: [
      "Hortifruti",
      "Padaria e Matinais",
      "Mercearia",
      "Frios e Laticínios",
      "Carnes e Aves",
      "Bebidas",
      "Limpeza",
      "Higiene e Perfumaria",
      "Outros"
    ]
  },

  festa: {
    id: "festa",
    label: "Eventos",
    icon: "🎉",
    placeholder: "Digite itens para evento, como descartáveis, bebidas, decoração...",
    defaultUnit: "unidade",
    units: ["unidade", "pacote", "caixa", "fardo", "kg", "litro", "garrafa"],
    categories: [
      "Bebidas",
      "Alimentos",
      "Descartáveis",
      "Decoração",
      "Limpeza",
      "Equipamentos",
      "Outros"
    ]
  },

  construcao: {
    id: "construcao",
    label: "Construção",
    icon: "🏗️",
    placeholder: "Digite materiais de construção, como cimento, areia, tijolo...",
    defaultUnit: "unidade",
    units: ["unidade", "saco", "metro", "m²", "m³", "kg", "litro", "barra", "rolo"],
    categories: [
      "Materiais Básicos",
      "Acabamento",
      "Hidráulica",
      "Ferragens",
      "Ferramentas",
      "Tintas",
      "Outros"
    ]
  },

  eletrico: {
    id: "eletrico",
    label: "Elétrico",
    icon: "⚡",
    placeholder: "Digite itens elétricos, como fio, tomada, disjuntor...",
    defaultUnit: "unidade",
    units: ["unidade", "metro", "rolo", "caixa", "barra", "kit"],
    categories: [
      "Fios e Cabos",
      "Tomadas e Interruptores",
      "Disjuntores e Proteção",
      "Iluminação",
      "Conduítes e Eletrodutos",
      "Ferramentas",
      "Outros"
    ]
  },

  escolar: {
    id: "escolar",
    label: "Escolar",
    icon: "🏫",
    placeholder: "Digite materiais escolares, como caderno, lápis, mochila...",
    defaultUnit: "unidade",
    units: ["unidade", "caixa", "pacote", "kit"],
    categories: [
      "Papelaria",
      "Escrita",
      "Cadernos e Papéis",
      "Artes",
      "Mochilas e Estojos",
      "Uniformes",
      "Outros"
    ]
  },

  farmacia: {
    id: "farmacia",
    label: "Farmácia",
    icon: "💊",
    placeholder: "Digite itens de farmácia, como fralda, sabonete, curativo...",
    defaultUnit: "unidade",
    units: ["unidade", "caixa", "pacote", "frasco", "tubo", "cartela"],
    categories: [
      "Medicamentos",
      "Higiene Pessoal",
      "Curativos",
      "Bebê",
      "Dermocosméticos",
      "Suplementos",
      "Outros"
    ]
  },

  condominio: {
    id: "condominio",
    label: "Condomínio",
    icon: "🏢",
    placeholder: "Digite itens para condomínio, como limpeza, manutenção, escritório...",
    defaultUnit: "unidade",
    units: ["unidade", "pacote", "caixa", "litro", "galão", "kg"],
    categories: [
      "Limpeza",
      "Manutenção",
      "Segurança",
      "Escritório",
      "Jardinagem",
      "Uso Comum",
      "Outros"
    ]
  },

  outros: {
    id: "outros",
    label: "Outras",
    icon: "📦",
    placeholder: "Digite os itens da sua lista...",
    defaultUnit: "unidade",
    units: ["unidade", "pacote", "caixa", "kg", "litro", "metro"],
    categories: [
      "Itens Gerais",
      "Outros"
    ]
  }
};

export function getListTypeConfig(type) {
  return LIST_TYPE_CONFIGS[type] || LIST_TYPE_CONFIGS.mercado;
}

export function getListTypePromptContext(type) {
  const config = getListTypeConfig(type);

  return [
    `Tipo de lista: ${config.label}`,
    `Categorias preferenciais: ${config.categories.join(", ")}`,
    `Unidades preferenciais: ${config.units.join(", ")}`,
    `Contexto: organize os itens considerando uma lista de ${config.label.toLowerCase()}.`
  ].join("\n");
}

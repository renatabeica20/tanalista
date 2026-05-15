export const LIST_TYPE_CONFIGS = {
  mercado: {
    id: "mercado",
    label: "Supermercado",
    icon: "🛒",
    placeholder: "Digite os itens da sua compra...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "pacote",
      "kg",
      "litro",
      "caixa",
      "fardo",
      "garrafa",
      "lata"
    ],
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
    placeholder: "Digite os itens do evento...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "pacote",
      "caixa",
      "fardo",
      "kg",
      "litro",
      "garrafa",
      "lata"
    ],
    categories: [
      "Carnes e Aves",
      "Bebidas",
      "Descartáveis e Embalagens",
      "Decoração",
      "Gelo e Apoio",
      "Outros"
    ]
  },

  construcao: {
    id: "construcao",
    label: "Construção",
    icon: "🏗️",
    placeholder: "Digite materiais de construção...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "saco",
      "metro",
      "m²",
      "kg",
      "litro",
      "barra",
      "rolo",
      "lata",
      "caixa",
      "mileiro"
    ],
    categories: [
      "Materiais Básicos",
      "Acabamento",
      "Hidráulica",
      "Ferragens",
      "Ferramentas",
      "Tintas e Pintura",
      "Elétrica",
      "Outros"
    ]
  },

  eletrico: {
    id: "eletrico",
    label: "Elétrico",
    icon: "⚡",
    placeholder: "Digite materiais elétricos...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "metro",
      "rolo",
      "caixa",
      "barra",
      "kit"
    ],
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
    placeholder: "Digite os materiais escolares...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "caixa",
      "pacote",
      "kit"
    ],
    categories: [
      "Cadernos",
      "Material de Escrita",
      "Papelaria",
      "Artes",
      "Mochilas e Estojos",
      "Outros"
    ]
  },

  farmacia: {
    id: "farmacia",
    label: "Farmácia",
    icon: "💊",
    placeholder: "Digite itens de farmácia...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "caixa",
      "pacote",
      "frasco",
      "tubo",
      "cartela"
    ],
    categories: [
      "Medicamentos",
      "Higiene Pessoal",
      "Curativos",
      "Bebês",
      "Dermocosméticos",
      "Outros"
    ]
  },

  condominio: {
    id: "condominio",
    label: "Condomínio",
    icon: "🏢",
    placeholder: "Digite itens do condomínio...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "pacote",
      "caixa",
      "litro",
      "galão",
      "kg"
    ],
    categories: [
      "Limpeza",
      "Higiene e Perfumaria",
      "Elétrica",
      "Manutenção",
      "Segurança",
      "Jardinagem",
      "Outros"
    ]
  },

  outros: {
    id: "outros",
    label: "Outras",
    icon: "📦",
    placeholder: "Digite os itens da sua lista...",
    defaultUnit: "unidade",
    units: [
      "unidade",
      "pacote",
      "caixa",
      "kg",
      "litro",
      "metro"
    ],
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

  return `
Tipo da lista: ${config.label}

Categorias permitidas:
${config.categories.join(", ")}

Regras obrigatórias:
- NÃO utilizar categorias de supermercado para listas técnicas.
- Organizar itens somente dentro das categorias do tipo selecionado.
- NÃO criar categoria "Mercearia" para Construção, Elétrica, Escolar ou Farmácia.
- NÃO misturar categorias de supermercado com outros segmentos.
- Use categorias coerentes com o segmento selecionado.
`;
}

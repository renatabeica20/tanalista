export const LIST_TYPE_RULES = {
  construcao: {
    invalidCategories: [
      "Mercearia",
      "Hortifruti",
      "Padaria e Matinais",
      "Carnes e Aves",
      "Cafés e Chás",
      "Snacks e Doces",
      "Bebidas"
    ],

    keywords: {
      "Materiais Básicos": [
        "cimento",
        "argamassa",
        "areia",
        "brita",
        "rejunte",
        "massa corrida"
      ],

      "Acabamento": [
        "porcelanato",
        "piso",
        "rodapé",
        "azulejo"
      ],

      "Ferragens": [
        "ferro",
        "prego",
        "parafuso",
        "vergalhão"
      ],

      "Tintas e Pintura": [
        "tinta",
        "rolo",
        "pincel",
        "lixa"
      ]
    }
  },

  eletrico: {
    invalidCategories: [
      "Mercearia",
      "Hortifruti",
      "Snacks e Doces",
      "Padaria e Matinais",
      "Cafés e Chás"
    ],

    keywords: {
      "Fios e Cabos": [
        "fio",
        "cabo"
      ],

      "Disjuntores e Proteção": [
        "disjuntor"
      ],

      "Conectores": [
        "conector",
        "barra de aterramento",
        "aterramento"
      ],

      "Iluminação": [
        "lâmpada",
        "refletor",
        "spot"
      ]
    }
  },

  escolar: {
    invalidCategories: [
      "Hortifruti",
      "Cafés e Chás",
      "Carnes e Aves",
      "Padaria e Matinais"
    ],

    keywords: {
      "Material de Escrita": [
        "lápis",
        "caneta",
        "borracha",
        "apontador"
      ],

      "Papelaria": [
        "fita",
        "durex",
        "papel",
        "cola"
      ],

      "Cadernos": [
        "caderno"
      ]
    }
  },

  farmacia: {
    invalidCategories: [
      "Mercearia",
      "Hortifruti",
      "Cafés e Chás"
    ],

    keywords: {
      "Medicamentos": [
        "dipirona",
        "histamin",
        "donaren",
        "torsilax"
      ],

      "Curativos": [
        "gaze",
        "algodão",
        "curativo"
      ],

      "Bebês": [
        "fralda",
        "nan",
        "fórmula"
      ]
    }
  },

  festa: {
    invalidCategories: [
      "Mercearia",
      "Hortifruti",
      "Limpeza",
      "Padaria e Matinais"
    ],

    keywords: {
      "Bebidas": [
        "cerveja",
        "refrigerante",
        "água",
        "suco"
      ],

      "Carnes e Aves": [
        "picanha",
        "linguiça",
        "carne",
        "frango",
        "coxinha da asa"
      ],

      "Descartáveis e Embalagens": [
        "copo",
        "guardanapo",
        "prato descartável"
      ],

      "Gelo e Apoio": [
        "gelo",
        "carvão",
        "fósforo"
      ]
    }
  },

  condominio: {
    invalidCategories: [
      "Hortifruti",
      "Cafés e Chás"
    ],

    keywords: {
      "Limpeza": [
        "pano",
        "flanela",
        "rodo",
        "vassoura",
        "água sanitária",
        "detergente"
      ],

      "Descartáveis e Embalagens": [
        "papel toalha",
        "saco de lixo"
      ]
    }
  }
};

export function getListTypeRules(type) {
  return LIST_TYPE_RULES[type] || null;
}

export const LIST_TYPE_SUGGESTIONS = {
  mercado: [
    "Arroz", "Feijão", "Macarrão", "Leite", "Café", "Açúcar", "Óleo",
    "Carne", "Frango", "Ovos", "Pão", "Queijo", "Presunto",
    "Banana", "Maçã", "Tomate", "Alface", "Detergente", "Sabonete"
  ],

  festa: [
    "Copo descartável", "Prato descartável", "Guardanapo", "Gelo",
    "Refrigerante", "Água", "Suco", "Carvão", "Carne", "Linguiça",
    "Pão de alho", "Bolo", "Doces", "Balões", "Toalha de mesa"
  ],

  construcao: [
    "Cimento", "Areia", "Brita", "Tijolo", "Argamassa", "Rejunte",
    "Piso", "Tinta", "Massa corrida", "Rolo de pintura", "Pincel",
    "Lixa", "Prego", "Parafuso", "Cano PVC", "Joelho PVC"
  ],

  eletrico: [
    "Fio 2,5mm", "Fio 4mm", "Tomada", "Interruptor", "Disjuntor",
    "Conduíte", "Caixa de passagem", "Lâmpada", "Bocal", "Fita isolante",
    "Plugue", "Extensão", "Canaleta", "Quadro de distribuição"
  ],

  escolar: [
    "Caderno", "Lápis", "Caneta", "Borracha", "Apontador", "Cola",
    "Tesoura sem ponta", "Régua", "Lápis de cor", "Canetinha",
    "Giz de cera", "Estojo", "Mochila", "Papel sulfite"
  ],

  farmacia: [
    "Fralda", "Lenço umedecido", "Sabonete", "Shampoo", "Condicionador",
    "Escova de dentes", "Creme dental", "Curativo", "Algodão",
    "Álcool 70%", "Soro fisiológico", "Protetor solar", "Repelente"
  ],

  condominio: [
    "Detergente", "Desinfetante", "Água sanitária", "Saco de lixo",
    "Papel higiênico", "Papel toalha", "Lâmpada", "Fita isolante",
    "Vassoura", "Rodo", "Pano de chão", "Luva de limpeza",
    "Material de escritório", "Cadeado"
  ],

  outros: [
    "Item 1", "Item 2", "Item 3"
  ]
};

export function getListTypeSuggestions(type) {
  return LIST_TYPE_SUGGESTIONS[type] || LIST_TYPE_SUGGESTIONS.mercado;
}

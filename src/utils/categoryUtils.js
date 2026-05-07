export function getCategoryTheme(category, fallbackTheme) {
  if (!category) return fallbackTheme;
  return fallbackTheme?.[category] || fallbackTheme?.Outros || {};
}

export function getCategoryIcon(category, fallbackTheme) {
  return getCategoryTheme(category, fallbackTheme)?.icon || "📦";
}

export function sortCategories(categories = []) {
  return [...categories].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR")
  );
}

export function countCategoryItems(category) {
  return Array.isArray(category?.items) ? category.items.length : 0;
}

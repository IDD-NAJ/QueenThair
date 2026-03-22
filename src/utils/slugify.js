export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function generateProductSlug(product) {
  return `${slugify(product.name)}-${product.id}`;
}

export function getIdFromSlug(slug) {
  const parts = slug.split('-');
  return parseInt(parts[parts.length - 1]);
}

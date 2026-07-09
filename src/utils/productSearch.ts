export interface ProductSearchSource {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  image?: unknown;
  images?: unknown;
  price?: string | number | null;
  description?: string | null;
  alt?: string | null;
  specs?: unknown;
  features?: unknown;
}

export function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stringifySearchValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(stringifySearchValue).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(stringifySearchValue)
      .join(' ');
  }
  return String(value);
}

export function buildProductSearchText(product: ProductSearchSource): string {
  return [
    product.name,
    product.slug,
    product.category,
    product.description,
    product.alt,
    stringifySearchValue(product.specs),
    stringifySearchValue(product.features),
    product.price,
  ].join(' ');
}

export function getProductSearchScore(product: ProductSearchSource, queryValue: string): number {
  const query = normalizeSearchText(queryValue);
  if (!query) return 0;

  const name = normalizeSearchText(product.name);
  const slug = normalizeSearchText(product.slug);
  const category = normalizeSearchText(product.category);
  const description = normalizeSearchText(product.description);
  const fullText = normalizeSearchText(buildProductSearchText(product));
  const compactQuery = query.replace(/[\s-]+/g, '');
  const compactNameSlug = [name, slug].join(' ').replace(/[\s-]+/g, '');
  const queryTokens = query.split(' ').filter(Boolean);

  let score = 0;

  if (name.startsWith(query)) score = Math.max(score, 120);
  if (name.includes(query)) score = Math.max(score, 100);
  if (slug.includes(query) || compactNameSlug.includes(compactQuery)) score = Math.max(score, 88);
  if (category.includes(query)) score = Math.max(score, 72);
  if (description.includes(query)) score = Math.max(score, 48);
  if (fullText.includes(query)) score = Math.max(score, 32);

  if (score === 0 && queryTokens.length > 1) {
    const matchedTokens = queryTokens.filter((token) => fullText.includes(token));
    if (matchedTokens.length === queryTokens.length) score = Math.max(score, 28);
  }

  return score;
}

export function getFirstProductImage(product: ProductSearchSource): string {
  const image = product.image;
  const images = product.images;

  if (typeof image === 'string' && image.trim()) return image;
  if (Array.isArray(image) && typeof image[0] === 'string') return image[0];
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0];

  return '/default-product.webp';
}

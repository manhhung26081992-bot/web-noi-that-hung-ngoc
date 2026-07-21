import type { Product } from '@/types/types';

export type BedProductGroup = 'bunk' | 'single' | 'unknown';

export interface GroupedBedProducts {
  bunkProducts: Product[];
  singleProducts: Product[];
  unknownProducts: Product[];
  allProducts: Product[];
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(normalizeText).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(normalizeText).join(' ');
  }

  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductText(product: Product): string {
  return normalizeText([
    product.name,
    product.slug,
    product.category,
    product.parent_slug,
    product.description,
    product.detailDescription,
    product.alt,
    product.specs,
    product.features,
  ]);
}

export function classifyBedProduct(product: Product): BedProductGroup {
  const nameAndSlugText = normalizeText([product.name, product.slug]);
  const text = getProductText(product);

  const isSingle =
    nameAndSlugText.includes('giuong don') ||
    nameAndSlugText.includes('giuong sat don') ||
    nameAndSlugText.includes('giuong-don') ||
    nameAndSlugText.includes('giuong-sat-don');

  if (isSingle) return 'single';

  const isBunk =
    /\b(2|hai)\s*tang\b/.test(text) ||
    text.includes('giuong tang') ||
    text.includes('lech tang') ||
    text.includes('cau thang hop') ||
    text.includes('co rem') ||
    text.includes('khung rem') ||
    text.includes('co ban hoc') ||
    text.includes('co hom');

  if (isBunk) return 'bunk';

  return 'unknown';
}

function bedPriority(product: Product): number {
  const text = getProductText(product);
  let score = 0;

  if (text.includes('giuong tang')) score += 60;
  if (text.includes('lech tang')) score += 55;
  if (/\b(2|hai)\s*tang\b/.test(text)) score += 45;
  if (text.includes('cau thang hop')) score += 25;
  if (text.includes('co ban hoc')) score += 25;
  if (text.includes('co hom') || text.includes('hoc do')) score += 20;
  if (text.includes('khung rem') || text.includes('co rem')) score += 20;

  return score;
}

function stableProductSort(a: Product, b: Product): number {
  const aScore = bedPriority(a);
  const bScore = bedPriority(b);
  if (aScore !== bScore) return bScore - aScore;

  const aId = Number(a.id);
  const bId = Number(b.id);
  if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
    return bId - aId;
  }

  return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
}

export function groupBedProducts(products: Product[]): GroupedBedProducts {
  const bunkProducts: Product[] = [];
  const singleProducts: Product[] = [];
  const unknownProducts: Product[] = [];

  products.forEach((product) => {
    const group = classifyBedProduct(product);
    if (group === 'bunk') bunkProducts.push(product);
    else if (group === 'single') singleProducts.push(product);
    else unknownProducts.push(product);
  });

  const sortedBunkProducts = [...bunkProducts].sort(stableProductSort);
  const allProducts = [...sortedBunkProducts, ...unknownProducts, ...singleProducts];

  return {
    bunkProducts: sortedBunkProducts,
    singleProducts,
    unknownProducts,
    allProducts,
  };
}


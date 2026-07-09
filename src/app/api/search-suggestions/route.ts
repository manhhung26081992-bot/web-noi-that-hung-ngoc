import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getFirstProductImage,
  getProductSearchScore,
  normalizeSearchText,
  type ProductSearchSource,
} from '@/utils/productSearch';

export const dynamic = 'force-dynamic';

const PRODUCT_SELECT =
  'id,name,slug,category,image,images,price,description,alt,specs,features';
const MAX_RESULTS = 10;
const BATCH_SIZE = 1000;
const MAX_BATCHES = 20;

interface SuggestionProduct extends ProductSearchSource {
  id: string | number;
  name: string;
  slug: string;
  category?: string | null;
}

async function fetchAllSuggestionProducts() {
  const products: SuggestionProduct[] = [];

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const from = batch * BATCH_SIZE;
    const to = from + BATCH_SIZE - 1;

    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as SuggestionProduct[];
    products.push(...rows);

    if (rows.length < BATCH_SIZE) break;
  }

  return products;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return NextResponse.json({ items: [] });
  }

  try {
    const products = await fetchAllSuggestionProducts();

    const items = products
      .map((product) => ({
        product,
        score: getProductSearchScore(product, normalizedQuery),
      }))
      .filter((item) => item.score > 0 && item.product.slug)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.product.name).localeCompare(String(b.product.name), 'vi');
      })
      .slice(0, MAX_RESULTS)
      .map(({ product }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category ?? '',
        image: getFirstProductImage(product),
        price: product.price ?? null,
        alt: product.alt || product.name,
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error(
      'Lỗi tải gợi ý sản phẩm:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

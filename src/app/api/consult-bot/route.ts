import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const siteUrl = 'https://www.noithathungngoc.com';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

type ProductRow = {
  name: string;
  slug: string;
  price: number | string | null;
  category?: string | null;
  parent_slug?: string | null;
  description?: string | null;
};

type CategoryRow = {
  title?: string | null;
  slug: string;
  seo_title?: string | null;
  seo_content?: string | null;
};

type BlogPostRow = {
  title: string;
  slug: string;
  excerpt?: string | null;
};

const policyAnswers = [
  {
    keywords: ['dat hang', 'so luong', 'mua nhieu', 'bao gia', 'bao gia so luong', 'don hang'],
    title: 'Báo giá đơn số lượng',
    summary:
      'Bạn gửi giúp shop tên sản phẩm hoặc mã HN, số lượng cần mua và địa chỉ giao hàng. Nội Thất Hùng Ngọc sẽ kiểm tra hàng sẵn, tối ưu mẫu phù hợp và báo giá số lượng qua Zalo/hotline 0347 227 377.',
    url: 'https://zalo.me/0347227377'
  },
  {
    keywords: ['giao', 'van chuyen', 'ship', 'ha noi', 'hanoi'],
    title: 'Giao hàng và vận chuyển',
    summary:
      'Nội Thất Hùng Ngọc hỗ trợ giao hàng tại Hà Nội và khu vực lân cận. Phí giao hàng phụ thuộc địa chỉ, số lượng và kích thước sản phẩm.',
    url: '/chinh-sach/van-chuyen'
  },
  {
    keywords: ['bao hanh', 'loi', 'hong', 'doi tra'],
    title: 'Bảo hành và đổi trả',
    summary:
      'Sản phẩm được hỗ trợ bảo hành theo từng nhóm hàng. Nếu cần đổi trả hoặc kiểm tra lỗi, khách nên liên hệ hotline 0347 227 377 để được hướng dẫn.',
    url: '/chinh-sach/bao-hanh'
  },
  {
    keywords: ['dia chi', 'kho', 'showroom', 'o dau'],
    title: 'Địa chỉ kho hàng',
    summary:
      'Kho hàng Nội Thất Hùng Ngọc tại 213 Nguyễn Văn Giáp, Nam Từ Liêm, Hà Nội. Khách có thể gọi trước hotline 0347 227 377 để được tư vấn.',
    url: 'https://www.google.com/maps/search/213+Nguy%E1%BB%85n+V%C4%83n+Gi%C3%A1p,+Nam+T%E1%BB%AB+Li%C3%AAm'
  }
];

const topicMap = [
  {
    match: ['tu', 'locker', 'tu locker', 'tu van phong', 'tu sat', 'tu tai lieu'],
    terms: ['tu', 'locker', 'tu locker', 'tu van phong', 'tu sat', 'tu tai lieu'],
    slugs: ['tu-locker', 'tu-van-phong', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu']
  },
  {
    match: ['ban', 'ban van phong', 'ban lam viec', 'ban hop', 'cum ban'],
    terms: ['ban', 'ban van phong', 'ban lam viec', 'ban hop', 'cum ban'],
    slugs: ['ban-van-phong', 'ban-lam-viec', 'ban-hop', 'cum-ban', 'cum-ban-lam-viec']
  },
  {
    match: ['ghe', 'ghe xoay', 'ghe van phong', 'ghe chan quy'],
    terms: ['ghe', 'ghe xoay', 'ghe van phong', 'ghe chan quy'],
    slugs: ['ghe-van-phong', 'ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc', 'ghe-gap']
  },
  {
    match: ['truong hoc', 'hoc sinh', 'ban ghe hoc sinh', 'bang tu'],
    terms: ['truong hoc', 'hoc sinh', 'ban ghe hoc sinh', 'bang tu'],
    slugs: ['truong-hoc', 'ban-ghe-hoc-sinh', 'bang-tu']
  },
  {
    match: ['sofa', 'ghe sofa', 'sofa giuong', 'sofa vang'],
    terms: ['sofa', 'ghe sofa', 'sofa giuong', 'sofa vang'],
    slugs: ['sofa', 'ghe-sofa', 'sofa-giuong', 'sofa-vang']
  },
  {
    match: ['cafe', 'ca phe', 'ban ghe cafe', 'ghe bar'],
    terms: ['cafe', 'ca phe', 'ban ghe cafe', 'ghe bar'],
    slugs: ['ban-ghe-cafe', 'ghe-bar', 'ban-an-mat-da-cafe']
  },
  {
    match: ['gia dinh', 'giuong', 'tu quan ao', 'tu giay', 'ke tivi'],
    terms: ['gia dinh', 'giuong', 'tu quan ao', 'tu giay', 'ke tivi'],
    slugs: ['gia-dinh', 'giuong-go', 'tu-quan-ao', 'tu-giay', 'ke-tivi']
  }
];

function normalizeKeyword(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildSearchProfile(query: string) {
  const normalizedQuery = normalizeKeyword(query);
  const stopWords = new Set(['ha', 'noi', 'hn', 'tai', 'shop', 'hang', 'giao', 'gia', 're']);
  const baseTokens = normalizedQuery
    .split(/\s+/)
    .filter((term) => term.length >= 2 && !stopWords.has(term));
  const terms = [...baseTokens, normalizedQuery];
  const slugs: string[] = [];

  topicMap.forEach((topic) => {
    if (topic.match.some((item) => normalizedQuery.includes(item))) {
      terms.push(...topic.terms);
      slugs.push(...topic.slugs);
    }
  });

  return {
    normalizedQuery,
    tokens: unique(terms.map(normalizeKeyword)),
    slugs: unique(slugs)
  };
}

function hasQuantityIntent(normalizedQuery: string) {
  return /\b\d+\s*(cai|chiec|bo|sp|san pham|cay|mau)\b/.test(normalizedQuery);
}

function matchesKeyword(normalizedQuery: string, keyword: string) {
  const normalizedKeyword = normalizeKeyword(keyword);

  if (normalizedKeyword.includes(' ')) {
    return normalizedQuery.includes(normalizedKeyword);
  }

  return new RegExp(`(^|\\s)${normalizedKeyword}(\\s|$)`).test(normalizedQuery);
}

function scoreText(text: string, tokens: string[]) {
  const normalizedText = normalizeKeyword(text);
  return tokens.reduce((score, token) => {
    if (!token) return score;
    if (normalizedText === token) return score + 8;
    if (normalizedText.includes(token)) return score + (token.length >= 5 ? 3 : 1);
    return score;
  }, 0);
}

function compactText(value: string) {
  return normalizeKeyword(value).replace(/[\s-]+/g, '');
}

function formatPrice(price: unknown) {
  if (price === null || price === undefined || price === '' || price === '0' || price === 0) {
    return 'Liên hệ báo giá';
  }

  const numberPrice = Number(price);
  if (Number.isNaN(numberPrice)) return String(price);

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numberPrice);
}

function shortSummary(value?: string | null, fallback = '') {
  const text = (value || fallback)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function rankProducts(products: ProductRow[], tokens: string[], slugs: string[]) {
  const compactTokens = tokens.map(compactText);

  return products
    .map((product) => {
      const text = [
        product.name,
        product.slug,
        product.category,
        product.parent_slug,
        product.description
      ].join(' ');
      const compactProductText = compactText(text);

      const slugScore =
        slugs.includes(product.category || '') || slugs.includes(product.parent_slug || '')
          ? 10
          : slugs.some((slug) => product.slug.includes(slug))
            ? 6
            : 0;
      const codeScore = tokens.some(
        (token) => /^hn\d+$/i.test(token) && compactProductText.includes(token)
      )
        ? 90
        : 0;
      const exactProductScore = compactTokens.some(
        (token) => token.length >= 8 && compactProductText.includes(token)
      )
        ? 40
        : 0;

      return {
        product,
        score: scoreText(text, tokens) + slugScore + codeScore + exactProductScore
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ product }) => ({
      name: product.name,
      price: formatPrice(product.price),
      url: `/san-pham/${product.slug}`,
      summary: shortSummary(product.description, `${product.name} tại Nội Thất Hùng Ngọc.`)
    }));
}

function rankCategories(categories: CategoryRow[], tokens: string[], slugs: string[]) {
  return categories
    .map((category) => {
      const text = [category.title, category.slug, category.seo_title, category.seo_content].join(' ');
      const slugScore = slugs.includes(category.slug) ? 10 : 0;

      return {
        category,
        score: scoreText(text, tokens) + slugScore
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ category }) => ({
      name: category.seo_title || category.title || category.slug,
      url: `/${category.slug}`,
      summary: shortSummary(category.seo_content, `Xem danh mục ${category.title || category.slug}.`)
    }));
}

function rankPosts(posts: BlogPostRow[], tokens: string[]) {
  return posts
    .map((post) => ({
      post,
      score: scoreText([post.title, post.slug, post.excerpt].join(' '), tokens)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ post }) => ({
      name: post.title,
      url: `/tin-tuc/${post.slug}`,
      summary: shortSummary(post.excerpt, `Bài viết tư vấn: ${post.title}.`)
    }));
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    const rawQuery = String(query || '').trim();

    if (!rawQuery) {
      return NextResponse.json({
        answer: 'Bạn cho shop biết sản phẩm hoặc nhu cầu cần tư vấn nhé.',
        products: [],
        categories: [],
        posts: [],
        policies: []
      });
    }

    const { normalizedQuery, tokens, slugs } = buildSearchProfile(rawQuery);

    const [productsResult, categoriesResult, postsResult] = await Promise.all([
      supabase
        .from('products')
        .select('name, slug, price, category, parent_slug, description')
        .limit(500),
      supabase
        .from('categories')
        .select('title, slug, seo_title, seo_content')
        .limit(200),
      supabase
        .from('blog_posts')
        .select('title, slug, excerpt')
        .limit(120)
    ]);

    const policies = policyAnswers.filter((item) =>
      item.keywords.some((keyword) => matchesKeyword(normalizedQuery, keyword))
    );
    const quantityPolicy = policyAnswers[0];
    const finalPolicies =
      hasQuantityIntent(normalizedQuery) && !policies.includes(quantityPolicy)
        ? [quantityPolicy, ...policies]
        : policies;
    const isPolicyQuestion = finalPolicies.length > 0;
    const products = isPolicyQuestion
      ? []
      : rankProducts((productsResult.data || []) as ProductRow[], tokens, slugs);
    const categories = isPolicyQuestion
      ? []
      : rankCategories((categoriesResult.data || []) as CategoryRow[], tokens, slugs);
    const posts = isPolicyQuestion ? [] : rankPosts((postsResult.data || []) as BlogPostRow[], tokens);

    let answer = 'Mình tìm thấy một số thông tin liên quan trên website.';

    if (products.length) {
      answer =
        'Mình tìm thấy vài sản phẩm phù hợp trên website. Bạn bấm xem sản phẩm, hoặc gửi Zalo để shop kiểm tra hàng sẵn và báo giá sát hơn.';
    } else if (categories.length) {
      answer =
        'Mình tìm thấy danh mục phù hợp. Bạn có thể mở danh mục để xem mẫu, hoặc nói rõ số lượng, kích thước và địa chỉ giao để shop tư vấn nhanh hơn.';
    } else if (posts.length) {
      answer =
        'Mình tìm thấy bài viết/cẩm nang liên quan. Bạn có thể mở đọc thêm, sau đó gửi Zalo nếu cần shop tư vấn trực tiếp.';
    } else if (finalPolicies.length) {
      answer = finalPolicies[0].summary;
    } else {
      answer =
        'Mình chưa tìm thấy kết quả thật sát. Bạn có thể hỏi theo tên sản phẩm, mã HN, danh mục như tủ locker, bàn văn phòng, ghế xoay, sofa, hoặc nhắn Zalo 0347 227 377 để shop tư vấn ngay.';
    }

    return NextResponse.json({
      answer,
      products,
      categories,
      posts,
      policies: finalPolicies.map((item) => ({
        name: item.title,
        summary: item.summary,
        url: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
      }))
    });
  } catch (error) {
    console.error('Consult bot error:', error);

    return NextResponse.json({
      answer:
        'Bot tư vấn đang gặp lỗi tạm thời. Bạn nhắn Zalo hoặc gọi 0347 227 377 để shop hỗ trợ nhanh nhé.',
      products: [],
      categories: [],
      posts: [],
      policies: []
    });
  }
}

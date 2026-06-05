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
    keywords: ['dat hang', 'so luong', 'mua nhieu', 'bao gia so luong', 'don hang'],
    title: 'Báo giá đơn số lượng',
    summary:
      'Bạn gửi giúp shop tên sản phẩm hoặc mã HN, số lượng cần mua và địa chỉ giao hàng. Nội Thất Hùng Ngọc sẽ kiểm tra hàng sẵn, tối ưu mẫu phù hợp và báo giá số lượng qua Zalo/hotline 0347 227 377.',
    url: 'https://zalo.me/0347227377'
  },
  {
    keywords: ['giao hang', 'van chuyen', 'ship hang', 'ship', 'giao ha noi', 'ship ha noi'],
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
    match: ['truong hoc', 'hoc sinh', 'ban ghe hoc sinh', 'ban giao vien', 'ghe giao vien', 'bang tu'],
    terms: ['truong hoc', 'hoc sinh', 'ban ghe hoc sinh', 'ban giao vien', 'ghe giao vien', 'bang tu'],
    slugs: ['truong-hoc', 'ban-ghe-hoc-sinh', 'ban-ghe-giao-vien', 'bang-tu']
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

const productIntentRules = [
  {
    label: 'sofa',
    keywords: ['sofa', 'ghe sofa', 'sofa phong khach', 'sofa gia dinh'],
    slugs: ['sofa', 'sofa-da', 'sofa-ni', 'sofa-vang', 'sofa-giuong', 'ban-sofa']
  },
  {
    label: 'tủ locker',
    keywords: ['locker', 'tu locker'],
    slugs: ['tu-locker']
  },
  {
    label: 'tủ văn phòng',
    keywords: ['tu van phong', 'tu tai lieu', 'tu sat', 'tu go'],
    slugs: ['tu-van-phong', 'tu-tai-lieu-go', 'tu-tai-lieu-sat', 'hoc-tu-tu-phu']
  },
  {
    label: 'bàn họp',
    keywords: ['ban hop', 'phong hop'],
    slugs: ['ban-hop']
  },
  {
    label: 'bàn làm việc',
    keywords: ['ban lam viec', 'ban nhan vien', 'cum ban', 'ban chan sat'],
    slugs: ['ban-lam-viec', 'ban-nhan-vien', 'cum-ban', 'ban-chan-sat']
  },
  {
    label: 'ghế văn phòng',
    keywords: ['ghe xoay', 'ghe van phong', 'ghe chan quy', 'ghe giam doc'],
    slugs: ['ghe-van-phong', 'ghe-xoay', 'ghe-chan-quy', 'ghe-giam-doc']
  },
  {
    label: 'nội thất trường học',
    keywords: ['truong hoc', 'hoc sinh', 'ban ghe hoc sinh', 'ban giao vien', 'ghe giao vien', 'bang tu'],
    slugs: ['truong-hoc', 'ban-ghe-hoc-sinh', 'bang-tu', 'ban-ghe-giao-vien']
  },
  {
    label: 'bàn ghế cafe',
    keywords: ['cafe', 'ca phe', 'ban ghe cafe', 'ghe bar'],
    slugs: ['ban-ghe-cafe', 'ghe-bar', 'ban-an-mat-da-cafe', 'ban-eames']
  },
  {
    label: 'giường',
    keywords: ['giuong', 'giuong go', 'giuong tang'],
    slugs: ['giuong-go', 'giuong-tang-sat']
  },
  {
    label: 'tủ giày',
    keywords: ['tu giay'],
    slugs: ['tu-giay']
  },
  {
    label: 'tủ quần áo',
    keywords: ['tu quan ao'],
    slugs: ['tu-quan-ao']
  }
];

productIntentRules.push(
  { label: 'sofa da', keywords: ['sofa da'], slugs: ['sofa-da'] },
  { label: 'sofa nỉ', keywords: ['sofa ni'], slugs: ['sofa-ni'] },
  { label: 'sofa giường', keywords: ['sofa giuong'], slugs: ['sofa-giuong'] },
  { label: 'bàn giám đốc', keywords: ['ban giam doc', 'ban truong phong'], slugs: ['ban-giam-doc'] },
  { label: 'bàn chân sắt', keywords: ['ban chan sat'], slugs: ['ban-chan-sat'] },
  { label: 'cụm bàn làm việc', keywords: ['cum ban', 'cum ban lam viec'], slugs: ['cum-ban', 'cum-ban-lam-viec'] },
  { label: 'ghế xoay', keywords: ['ghe xoay'], slugs: ['ghe-xoay'] },
  { label: 'ghế chân quỳ', keywords: ['ghe chan quy'], slugs: ['ghe-chan-quy'] },
  { label: 'bàn ghế học sinh', keywords: ['ban ghe hoc sinh', 'ban hoc sinh', 'ghe hoc sinh'], slugs: ['ban-ghe-hoc-sinh'] },
  { label: 'bàn ghế giáo viên', keywords: ['ban giao vien', 'ghe giao vien', 'ban ghe giao vien'], slugs: ['ban-ghe-giao-vien'] },
  { label: 'bảng từ', keywords: ['bang tu', 'bang trang'], slugs: ['bang-tu'] },
  {
    label: 'ban ghe an',
    keywords: ['ban ghe an', 'bo ban an', 'ban an', 'ghe an'],
    slugs: ['ban-ghe-an', 'bo-ban-an-4-ghe', 'bo-ban-an-6-ghe', 'ban-an-mat-da', 'ghe-an']
  },
  { label: 'giường tầng sắt', keywords: ['giuong tang sat', 'giuong sat 2 tang'], slugs: ['giuong-tang-sat'] },
  { label: 'kệ gỗ / kệ sách', keywords: ['ke go', 'ke sach', 'ke trang tri'], slugs: ['ke-go', 'ke-sach', 'ke-trang-tri'] },
  { label: 'kệ tivi', keywords: ['ke tivi', 'ke ti vi'], slugs: ['ke-ti-vi'] },
  { label: 'két sắt', keywords: ['ket sat'], slugs: ['ket-sat'] }
);

const scenarioIntentRules = [
  { type: 'price', keywords: ['gia', 'bao nhieu', 'bao gia', 'duoi', 're', 'tam gia', 'ngan sach'] },
  { type: 'stock', keywords: ['co hang', 'hang san', 'con hang', 'san khong', 'ton kho', 'het hang'] },
  { type: 'quantity', keywords: ['so luong', 'mua nhieu', 'mua 10', 'mua 20', 'dat nhieu', 'don lon', 'chiet khau'] },
  { type: 'size', keywords: ['kich thuoc', 'dai', 'rong', 'cao', '1m2', '1m4', '1m6', '1m8', '2m', '2m4', '3m2'] },
  { type: 'material', keywords: ['chat lieu', 'go cong nghiep', 'go tu nhien', 'sat', 'da', 'ni', 'mfc', 'son pu'] },
  { type: 'durability', keywords: ['ben khong', 'co ben', 'chac khong', 'chiu luc', 'tot khong', 'dung lau'] },
  { type: 'color', keywords: ['mau', 'mau trang', 'mau den', 'mau ghi', 'mau vang', 'mau go', 'mau xanh'] },
  { type: 'room', keywords: ['phong nho', 'phong khach', 'chung cu', 'dien tich', 'm2', 'm vuong', 'met vuong'] },
  { type: 'delivery', keywords: ['giao hang', 'van chuyen', 'ship', 'giao trong ngay', 'giao ve tinh', 'lap dat'] },
  { type: 'warranty', keywords: ['bao hanh', 'doi tra', 'loi', 'hong'] },
  { type: 'invoice', keywords: ['hoa don', 'vat', 'xuat hoa don', 'cong ty'] },
  { type: 'compare', keywords: ['nen chon', 'loai nao', 'tu van', 'phu hop', 'khac nhau', 'so sanh'] }
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

function isRoomSizeAnswer(normalizedQuery: string) {
  return /\b\d+\s*(m2|m vuong|met vuong|m)\b/.test(normalizedQuery);
}

function hasSofaContext(normalizedContext: string) {
  return (
    normalizedContext.includes('sofa') ||
    normalizedContext.includes('noi that gia dinh') ||
    normalizedContext.includes('gia dinh')
  );
}

function hasClearProductIntent(normalizedQuery: string) {
  return (
    /\bhn\d+\b/i.test(normalizedQuery) ||
    [
      'sofa',
      'locker',
      'tu',
      'ban',
      'ghe',
      'giuong',
      'ke',
      'cafe',
      'hoc sinh',
      'ban hop',
      'ban lam viec'
    ].some((keyword) => normalizedQuery.includes(keyword))
  );
}

function detectProductIntent(normalizedQuery: string) {
  return productIntentRules
    .map((rule) => ({
      rule,
      score: Math.max(
        0,
        ...rule.keywords
          .filter((keyword) => matchesKeyword(normalizedQuery, keyword))
          .map((keyword) => normalizeKeyword(keyword).length)
      )
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rule.slugs.length - b.rule.slugs.length)[0]?.rule;
}

function detectScenarioIntent(normalizedQuery: string) {
  return scenarioIntentRules
    .map((rule) => ({
      rule,
      score: Math.max(
        0,
        ...rule.keywords
          .filter((keyword) => matchesKeyword(normalizedQuery, keyword))
          .map((keyword) => normalizeKeyword(keyword).length)
      )
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.rule;
}

function buildScenarioAnswer(
  scenarioType: string | undefined,
  productLabel?: string,
  hasProducts = false
) {
  const target = productLabel ? `nhóm ${productLabel}` : 'sản phẩm bạn đang quan tâm';

  switch (scenarioType) {
    case 'price':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Giá có thể thay đổi theo mẫu, kích thước và số lượng. Bạn bấm xem mẫu phù hợp, hoặc gửi Zalo để shop báo giá sát hơn.`
        : 'Bạn cho shop xin tên sản phẩm, mã HN hoặc nhóm hàng cần mua để báo giá sát hơn nhé.';
    case 'stock':
      return hasProducts
        ? `Mình tìm thấy ${target}. Hàng sẵn có thể thay đổi theo ngày, bạn gửi mã HN qua Zalo để shop kiểm tra tồn kho và thời gian giao chính xác.`
        : 'Bạn cho shop xin tên sản phẩm hoặc mã HN cụ thể để kiểm tra hàng sẵn chính xác hơn nhé.';
    case 'quantity':
      return `Với đơn số lượng, bạn gửi giúp shop ${productLabel ? `nhóm hàng ${productLabel}` : 'tên sản phẩm'}, số lượng cần mua và địa chỉ giao. Shop sẽ tối ưu mẫu phù hợp và báo giá số lượng qua Zalo/hotline 0347 227 377.`;
    case 'size':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Bạn bấm vào mẫu để xem thông số; nếu cần kích thước cụ thể, gửi mã HN qua Zalo để shop kiểm tra nhanh.`
        : 'Bạn cho shop biết loại sản phẩm và kích thước mong muốn, ví dụ 1m2, 1m6, 2m4 hoặc diện tích phòng để tư vấn đúng hơn.';
    case 'material':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Chất liệu tùy từng mẫu như gỗ công nghiệp, sắt sơn tĩnh điện, da hoặc nỉ; bạn bấm xem mẫu hoặc gửi mã HN để shop tư vấn kỹ hơn.`
        : 'Bạn muốn hỏi chất liệu của nhóm nào: sofa, tủ locker, bàn làm việc, bàn họp, ghế văn phòng hay tủ gia đình?';
    case 'durability':
      return hasProducts
        ? `${target} nên chọn theo chất liệu, kết cấu chân/khung và nhu cầu sử dụng. Mình đã lọc vài mẫu liên quan; nếu dùng cho văn phòng/trường học số lượng lớn, shop sẽ tư vấn mẫu bền và tiết kiệm hơn.`
        : 'Bạn cho shop biết sản phẩm dùng cho gia đình, văn phòng, trường học hay quán cafe để tư vấn loại bền phù hợp.';
    case 'color':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Màu sắc còn tùy mẫu và lô hàng; bạn gửi mã HN hoặc ảnh không gian qua Zalo để shop gợi ý màu dễ phối.`
        : 'Bạn muốn chọn màu cho sản phẩm nào? Shop có thể tư vấn màu theo không gian và nhóm hàng.';
    case 'room':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Với thông tin diện tích/phòng, shop sẽ ưu tiên mẫu vừa kích thước, dễ kê và còn lối đi. Bạn gửi thêm ảnh phòng qua Zalo để tư vấn sát hơn.`
        : 'Bạn cho shop biết phòng dùng để đặt sofa, bàn làm việc, bàn ăn, tủ hay giường để mình tư vấn đúng nhóm sản phẩm.';
    case 'delivery':
      return 'Nội Thất Hùng Ngọc hỗ trợ giao hàng tại Hà Nội và khu vực lân cận. Phí giao phụ thuộc địa chỉ, số lượng và kích thước sản phẩm; bạn gửi mã HN/số lượng để shop báo chính xác.';
    case 'warranty':
      return 'Sản phẩm được hỗ trợ bảo hành theo từng nhóm hàng. Nếu cần kiểm tra bảo hành/đổi trả, bạn gửi mã sản phẩm hoặc ảnh lỗi qua Zalo 0347 227 377 để shop hướng dẫn.';
    case 'invoice':
      return 'Nếu mua cho công ty và cần hóa đơn, bạn gửi thông tin đơn hàng, số lượng và thông tin xuất hóa đơn để shop kiểm tra hỗ trợ.';
    case 'compare':
      return hasProducts
        ? `Mình đang lọc đúng ${target}. Nếu bạn phân vân, shop sẽ so sánh theo ngân sách, kích thước, độ bền và không gian sử dụng.`
        : 'Bạn đang phân vân giữa những nhóm nào? Ví dụ sofa da hay sofa nỉ, tủ sắt hay tủ gỗ, ghế xoay hay ghế chân quỳ.';
    default:
      return undefined;
  }
}

function hasQuantityIntent(normalizedQuery: string) {
  return /\b\d+\s*(cai|chiec|bo|sp|san pham|cay|mau)\b/.test(normalizedQuery);
}

function hasStockIntent(normalizedQuery: string) {
  return [
    'co hang',
    'hang san',
    'con hang',
    'san khong',
    'ton kho',
    'het hang'
  ].some((keyword) => normalizedQuery.includes(keyword));
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

function matchesAllowedSlugs(product: ProductRow, allowedSlugs: string[]) {
  if (!allowedSlugs.length) return true;

  return allowedSlugs.some(
    (slug) =>
      product.category === slug ||
      product.parent_slug === slug ||
      product.slug.includes(slug)
  );
}

function rankProducts(
  products: ProductRow[],
  tokens: string[],
  slugs: string[],
  allowedSlugs: string[] = [],
  requestedCode = ''
) {
  const compactTokens = tokens.map(compactText);

  return products
    .filter((product) => matchesAllowedSlugs(product, allowedSlugs))
    .filter((product) => {
      if (!requestedCode) return true;

      return compactText(`${product.name} ${product.slug}`).includes(requestedCode);
    })
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
    .filter((item) => item.score > 0 || allowedSlugs.length > 0)
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
    const { query, context } = await request.json();
    const rawQuery = String(query || '').trim();
    const rawContext = String(context || '').trim();

    if (!rawQuery) {
      return NextResponse.json({
        answer: 'Bạn cho shop biết sản phẩm hoặc nhu cầu cần tư vấn nhé.',
        products: [],
        categories: [],
        posts: [],
        policies: []
      });
    }

    const normalizedContext = normalizeKeyword(rawContext);
    const combinedQuery = rawContext ? `${rawContext} ${rawQuery}` : rawQuery;
    const { normalizedQuery, tokens, slugs } = buildSearchProfile(combinedQuery);
    const normalizedRawQuery = normalizeKeyword(rawQuery);
    const requestedCode = normalizedRawQuery.match(/\bhn\d+\b/i)?.[0] || '';
    const productIntent =
      detectProductIntent(normalizedRawQuery) || detectProductIntent(normalizedContext);
    const scenarioIntent =
      detectScenarioIntent(normalizedRawQuery) || detectScenarioIntent(normalizedContext);

    if (isRoomSizeAnswer(normalizedRawQuery) && hasSofaContext(normalizedContext)) {
      return NextResponse.json({
        answer:
          'Với phòng khoảng 30m2, bạn nên ưu tiên sofa góc chữ L hoặc sofa văng kích thước vừa phải để còn lối đi và chỗ đặt bàn trà. Nếu phòng khách rộng, sofa góc sẽ tạo cảm giác đủ đầy hơn; nếu cần gọn, sofa văng 2m2-2m8 dễ bố trí hơn. Bạn gửi ảnh phòng hoặc vị trí đặt sofa qua Zalo, shop sẽ gợi ý mẫu và kích thước sát hơn.',
        products: [],
        categories: [
          {
            name: 'Sofa',
            url: `${siteUrl}/sofa`,
            summary: 'Xem các mẫu sofa phù hợp phòng khách và nội thất gia đình.'
          },
          {
            name: 'Sofa da',
            url: `${siteUrl}/sofa-da`,
            summary: 'Phù hợp phòng khách cần dễ vệ sinh, nhìn sang và bền.'
          },
          {
            name: 'Sofa nỉ',
            url: `${siteUrl}/sofa-ni`,
            summary: 'Phù hợp không gian gia đình cần cảm giác ấm và mềm.'
          }
        ],
        posts: [],
        policies: []
      });
    }

    if (isRoomSizeAnswer(normalizedRawQuery) && !hasClearProductIntent(normalizedRawQuery)) {
      return NextResponse.json({
        answer:
          'Mình đã nhận diện tích phòng. Bạn cho shop biết thêm bạn muốn chọn sofa, bàn ghế ăn, tủ giày, tủ quần áo hay bàn làm việc để mình gợi ý đúng nhóm sản phẩm hơn. Nếu cần nhanh, bạn gửi ảnh phòng qua Zalo 0347 227 377 để shop tư vấn trực tiếp.',
        products: [],
        categories: [],
        posts: [],
        policies: []
      });
    }

    if (hasStockIntent(normalizedRawQuery) && !productIntent && !requestedCode) {
      return NextResponse.json({
        answer:
          'Bạn cho shop xin tên sản phẩm hoặc mã HN cụ thể để kiểm tra hàng sẵn chính xác hơn nhé. Hàng trong kho có thể thay đổi theo ngày, nên nếu cần nhanh bạn gửi mã sản phẩm qua Zalo 0347 227 377 để shop kiểm tra tồn và báo thời gian giao.',
        products: [],
        categories: [],
        posts: [],
        policies: [
          {
            name: 'Kiểm tra hàng sẵn',
            summary: 'Gửi mã HN hoặc tên sản phẩm qua Zalo để shop kiểm tra tồn kho nhanh.',
            url: 'https://zalo.me/0347227377'
          }
        ]
      });
    }

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
    const intentSlugs = productIntent ? productIntent.slugs : [];
    const searchSlugs = unique([...slugs, ...intentSlugs]);
    const skipProductSuggestions =
      !productIntent &&
      !requestedCode &&
      ['invoice', 'delivery', 'warranty'].includes(scenarioIntent?.type || '');
    const products = isPolicyQuestion || skipProductSuggestions
      ? []
      : rankProducts(
          (productsResult.data || []) as ProductRow[],
          tokens,
          searchSlugs,
          intentSlugs,
          requestedCode
        );
    const categories = isPolicyQuestion || skipProductSuggestions
      ? []
      : rankCategories((categoriesResult.data || []) as CategoryRow[], tokens, searchSlugs);
    const posts = isPolicyQuestion || skipProductSuggestions
      ? []
      : rankPosts((postsResult.data || []) as BlogPostRow[], tokens);

    let answer = 'Mình tìm thấy một số thông tin liên quan trên website.';
    const scenarioAnswer = buildScenarioAnswer(
      scenarioIntent?.type,
      productIntent?.label,
      products.length > 0
    );

    if (products.length) {
      answer = scenarioAnswer || (productIntent
        ? `Mình đang lọc đúng nhóm ${productIntent.label} theo nhu cầu của bạn. Bạn bấm xem mẫu phù hợp, hoặc gửi Zalo để shop kiểm tra hàng sẵn và báo giá sát hơn.`
        : 'Mình tìm thấy vài sản phẩm phù hợp trên website. Bạn bấm xem sản phẩm, hoặc gửi Zalo để shop kiểm tra hàng sẵn và báo giá sát hơn.');
    } else if (categories.length) {
      answer =
        scenarioAnswer ||
        'Mình tìm thấy danh mục phù hợp. Bạn có thể mở danh mục để xem mẫu, hoặc nói rõ số lượng, kích thước và địa chỉ giao để shop tư vấn nhanh hơn.';
    } else if (posts.length) {
      answer =
        'Mình tìm thấy bài viết/cẩm nang liên quan. Bạn có thể mở đọc thêm, sau đó gửi Zalo nếu cần shop tư vấn trực tiếp.';
    } else if (finalPolicies.length) {
      answer = finalPolicies[0].summary;
    } else if (scenarioAnswer) {
      answer = scenarioAnswer;
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

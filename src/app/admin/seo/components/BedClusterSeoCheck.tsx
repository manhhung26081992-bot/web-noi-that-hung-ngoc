'use client';

import { useMemo } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import type { ProductSeoItem, SeoBlogQualityItem, SeoKeyword } from '../types/seo';
import styles from '../seo-dashboard.module.css';

const MAIN_BED_PATH = '/giuong-tang-sat';
const MAIN_BED_URL = 'https://www.noithathungngoc.com/giuong-tang-sat/';
const SAFE_ANCHORS = [
  'các mẫu giường sắt tại Nội Thất Hùng Ngọc',
  'danh mục giường tầng bằng sắt',
  'mẫu giường sắt phù hợp phòng trọ',
  'các mẫu giường tiết kiệm diện tích',
  'giường tầng phù hợp ký túc xá',
];
const OVERUSED_ANCHOR = 'giường sắt 2 tầng giá rẻ tại Hà Nội';

type BedClusterStatus = 'Tốt' | 'Thiếu link' | 'Có nguy cơ trùng từ khóa' | 'Cần kiểm tra';
type BedClusterRow = {
  id: string;
  type: 'danh mục' | 'sản phẩm' | 'tin tức';
  title: string;
  url: string;
  sourceText: string;
  primaryKeyword: string;
  hasMainLink: boolean;
  mainAnchor: string;
  hasProductLink: boolean;
  contentLength: number;
  issues: string[];
  status: BedClusterStatus;
};

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value: unknown) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pathOnly(value: string) {
  try {
    if (value.startsWith('http')) return new URL(value).pathname.replace(/\/$/, '');
  } catch {}
  return ('/' + String(value || '').replace(/^\/+|\/+$/g, '')).replace(/\/$/, '') || '/';
}

function productUrl(product: ProductSeoItem) {
  return '/san-pham/' + String(product.slug || '').replace(/^\/+|\/+$/g, '');
}

function blogUrl(blog: SeoBlogQualityItem) {
  return '/tin-tuc/' + String(blog.slug || '').replace(/^\/+|\/+$/g, '');
}


function containsBedTerm(...values: unknown[]) {
  const text = normalize(values.join(' '));
  return text.includes('giuong') || text.includes('hn402') || text.includes('hn417') || text.includes('hn411') || text.includes('hn409');
}

function hasMainLink(html: string) {
  const text = normalize(html);
  return text.includes('/giuong-tang-sat') || text.includes('noithathungngoc.com/giuong-tang-sat');
}

function extractAnchorToMain(html: string) {
  const direct = new RegExp("<a\\b[^>]*href=[\"\'](?:https?:\\/\\/www\\.noithathungngoc\\.com)?\\/giuong-tang-sat\\/?[\"\'][^>]*>([\\s\\S]*?)<\\/a>", "i").exec(html);
  if (direct?.[1]) return stripHtml(direct[1]);
  return hasMainLink(html) ? 'Có link nhưng chưa đọc được anchor' : '';
}

function hasProductLink(html: string) {
  const text = normalize(html);
  return text.includes('/san-pham/') || text.includes('hn402') || text.includes('hn417') || text.includes('hn411') || text.includes('hn409');
}

function findKeywordForUrl(keywords: SeoKeyword[], url: string) {
  const cleanUrl = pathOnly(url);
  const exact = keywords.find((keyword) => pathOnly(keyword.target_url || '') === cleanUrl);
  if (exact?.keyword) return exact.keyword;

  const clusterMatch = keywords.find((keyword) => {
    const target = pathOnly(keyword.target_url || '');
    return target === cleanUrl || (target && cleanUrl.includes(target)) || normalize(keyword.cluster).includes('giuong');
  });

  return clusterMatch?.target_url && pathOnly(clusterMatch.target_url) === cleanUrl ? clusterMatch.keyword : '';
}

function baseStatus(issues: string[]): BedClusterStatus {
  if (issues.includes('Có nguy cơ trùng từ khóa')) return 'Có nguy cơ trùng từ khóa';
  if (issues.includes('Thiếu link về trang chính')) return 'Thiếu link';
  if (issues.length) return 'Cần kiểm tra';
  return 'Tốt';
}

function statusForBadge(status: BedClusterStatus): 'ok' | 'pending' | 'warning' {
  if (status === 'Tốt') return 'ok';
  if (status === 'Cần kiểm tra') return 'pending';
  return 'warning';
}

function createRows(products: ProductSeoItem[], blogs: SeoBlogQualityItem[], keywords: SeoKeyword[]) {
  const rows: BedClusterRow[] = [
    {
      id: 'category-giuong-tang-sat',
      type: 'danh mục',
      title: 'Giường tầng sắt',
      url: MAIN_BED_PATH,
      sourceText: 'Trang chính của cụm giường.',
      primaryKeyword: findKeywordForUrl(keywords, MAIN_BED_PATH) || 'giường sắt 2 tầng giá rẻ tại Hà Nội',
      hasMainLink: true,
      mainAnchor: 'Trang chính',
      hasProductLink: true,
      contentLength: 0,
      issues: [],
      status: 'Tốt',
    },
  ];

  products
    .filter((product) => containsBedTerm(product.name, product.slug, product.category, product.parent_slug, product.description, product.detailDescription))
    .forEach((product) => {
      const url = productUrl(product);
      const html = [product.description, product.detailDescription, JSON.stringify(product.features || ''), JSON.stringify(product.specs || '')].join(' ');
      const issues: string[] = [];
      const textLength = stripHtml(html).length;
      const mainLink = hasMainLink(html);
      const productLink = hasProductLink(html);

      if (!mainLink) issues.push('Thiếu link về trang chính');
      if (textLength < 300) issues.push('Nội dung mỏng');

      rows.push({
        id: 'product-' + String(product.id || product.slug),
        type: 'sản phẩm',
        title: product.name || product.slug || 'Sản phẩm giường',
        url,
        sourceText: html,
        primaryKeyword: findKeywordForUrl(keywords, url),
        hasMainLink: mainLink,
        mainAnchor: extractAnchorToMain(html),
        hasProductLink: productLink,
        contentLength: textLength,
        issues,
        status: baseStatus(issues),
      });
    });

  blogs
    .filter((blog) => containsBedTerm(blog.title, blog.slug, blog.excerpt, blog.content))
    .forEach((blog) => {
      const url = blogUrl(blog);
      const html = [blog.excerpt, blog.content].join(' ');
      const issues: string[] = [];
      const textLength = stripHtml(html).length;
      const mainLink = hasMainLink(html);
      const productLink = hasProductLink(html);

      if (!mainLink) issues.push('Thiếu link về trang chính');
      if (textLength < 700) issues.push('Nội dung mỏng');
      if (!productLink) issues.push('Thiếu link sản phẩm hỗ trợ');

      rows.push({
        id: 'blog-' + String(blog.id || blog.slug),
        type: 'tin tức',
        title: blog.title || blog.slug || 'Bài viết giường',
        url,
        sourceText: html,
        primaryKeyword: findKeywordForUrl(keywords, url),
        hasMainLink: mainLink,
        mainAnchor: extractAnchorToMain(html),
        hasProductLink: productLink,
        contentLength: textLength,
        issues,
        status: baseStatus(issues),
      });
    });

  const keywordCounts = new Map<string, number>();
  rows.forEach((row) => {
    const key = normalize(row.primaryKeyword);
    if (key && key !== normalize('Chưa gán')) keywordCounts.set(key, (keywordCounts.get(key) || 0) + 1);
  });

  const anchorCounts = new Map<string, number>();
  rows.forEach((row) => {
    const key = normalize(row.mainAnchor);
    if (key && key !== normalize('Trang chính')) anchorCounts.set(key, (anchorCounts.get(key) || 0) + 1);
  });

  return rows.map((row) => {
    const issues = [...row.issues];
    const keywordKey = normalize(row.primaryKeyword);
    const anchorKey = normalize(row.mainAnchor);
    if (keywordKey && (keywordCounts.get(keywordKey) || 0) > 1) issues.push('Có nguy cơ trùng từ khóa');
    if (anchorKey && ((anchorCounts.get(anchorKey) || 0) > 2 || anchorKey === normalize(OVERUSED_ANCHOR))) {
      issues.push('Anchor bị lặp, nên xoay vòng');
    }
    const uniqueIssues = Array.from(new Set(issues));
    return { ...row, primaryKeyword: row.primaryKeyword || 'Chưa gán', issues: uniqueIssues, status: row.type === 'danh mục' ? 'Tốt' : baseStatus(uniqueIssues) };
  });
}

export default function BedClusterSeoCheck({ products, blogs, keywords }: { products: ProductSeoItem[]; blogs: SeoBlogQualityItem[]; keywords: SeoKeyword[] }) {
  const rows = useMemo(() => createRows(products, blogs, keywords), [blogs, keywords, products]);
  const summary = useMemo(() => ({
    total: rows.length,
    missingMain: rows.filter((row) => row.issues.includes('Thiếu link về trang chính')).length,
    duplicateKeyword: rows.filter((row) => row.issues.includes('Có nguy cơ trùng từ khóa')).length,
    thinContent: rows.filter((row) => row.issues.includes('Nội dung mỏng')).length,
  }), [rows]);

  return (
    <div className={styles.stack}>
      <section className={styles.metricGridSmall}>
        <MetricCard label="URL trong cụm giường" value={summary.total} hint={MAIN_BED_URL} />
        <MetricCard label="Thiếu link về trang chính" value={summary.missingMain} />
        <MetricCard label="Nguy cơ trùng từ khóa" value={summary.duplicateKeyword} />
        <MetricCard label="Nội dung mỏng" value={summary.thinContent} />
      </section>

      <section className={styles.gridTwo}>
        <ModuleCard title="Anchor an toàn nên xoay vòng" description="Dùng các anchor này khi thêm link về /giuong-tang-sat/. Không lặp quá nhiều anchor chính xác.">
          <div className={styles.bedAnchorGrid}>
            {SAFE_ANCHORS.map((anchor) => <span key={anchor}>{anchor}</span>)}
          </div>
        </ModuleCard>
        <ModuleCard title="Checklist 7 ngày cho cụm giường" description="Chỉ theo dõi và sửa thủ công, không tự động ghi vào Supabase.">
          <ul className={styles.bedChecklist}>
            <li>Kiểm tra 5 bài giường cũ có link về /giuong-tang-sat/ chưa.</li>
            <li>Sửa anchor bị lặp, xoay vòng anchor tự nhiên hơn.</li>
            <li>Thêm link từ bài giường sang HN402 nếu nói về phòng trọ.</li>
            <li>Thêm link từ bài giường sang HN417 nếu nói về giường tầng sắt hộp.</li>
            <li>Tối ưu tiếp HN411 hoặc HN409 nếu sản phẩm đã hiển thị đúng sau deploy.</li>
            <li>Không sửa lại /giuong-tang-sat/ trong 7 ngày.</li>
            <li>Kiểm tra Search Console sau 7 ngày.</li>
          </ul>
        </ModuleCard>
      </section>

      <ModuleCard title="Kiểm tra cụm SEO Giường" description="Danh sách chỉ đọc từ products, blog_posts và seo_keywords. Module này chỉ báo lỗi, không sửa nội dung.">
        {rows.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Loại trang</th>
                  <th>Tiêu đề</th>
                  <th>Slug / URL</th>
                  <th>Từ khóa chính</th>
                  <th>Link về trang chính</th>
                  <th>Anchor đang dùng</th>
                  <th>Link sản phẩm</th>
                  <th>Trạng thái gợi ý</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td><strong>{row.title}</strong><small className={styles.bedMutedLine}>{row.contentLength ? String(row.contentLength) + ' ký tự nội dung' : 'Trang chính'}</small></td>
                    <td><a className={styles.link} href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
                    <td>{row.primaryKeyword}</td>
                    <td>{row.hasMainLink ? <Badge status="ok">Có</Badge> : <Badge status="warning">Thiếu</Badge>}</td>
                    <td>{row.mainAnchor || '-'}</td>
                    <td>{row.hasProductLink ? <Badge status="ok">Có</Badge> : <Badge status="pending">Cần bổ sung</Badge>}</td>
                    <td>
                      <Badge status={statusForBadge(row.status)}>{row.status}</Badge>
                      {row.issues.length ? <ul className={styles.bedIssueList}>{row.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Chưa tìm thấy URL cụm giường" detail="Kiểm tra lại dữ liệu products, blog_posts hoặc từ khóa giường trong Supabase." />}
      </ModuleCard>
    </div>
  );
}

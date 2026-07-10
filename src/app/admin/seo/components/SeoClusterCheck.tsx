'use client';

import { useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import { SEO_CLUSTER_GROUPS, priorityLabel, type SeoClusterConfig } from '../seoClustersConfig';
import type { ProductSeoItem, SeoBlogQualityItem, SeoKeyword, SeoCluster } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type ClusterStatus = 'Tốt' | 'Thiếu link' | 'Có nguy cơ trùng từ khóa' | 'Cần kiểm tra trùng từ khóa' | 'Cần kiểm tra' | 'Theo dõi';
type ClusterRowType = 'danh mục' | 'sản phẩm' | 'tin tức';
type BlogMatchSource = 'main-link' | 'identity' | 'content';

type HtmlLink = {
  href: string;
  text: string;
};

type ClusterRow = {
  id: string;
  type: ClusterRowType;
  title: string;
  url: string;
  identityText: string;
  linkHtml: string;
  primaryKeyword: string;
  hasMainLink: boolean;
  mainAnchors: string[];
  mainAnchor: string;
  hasProductLink: boolean;
  contentLength: number;
  issues: string[];
  status: ClusterStatus;
  productMatchSource?: 'category' | 'keyword';
  blogMatchSource?: BlogMatchSource;
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

function escapeRegExp(value: string) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function keywordInText(text: string, keyword: string) {
  const haystack = normalize(text);
  const needle = normalize(keyword);
  if (!needle) return false;
  if (!needle.includes(' ') && needle.length <= 3) {
    return new RegExp('(^|[^a-z0-9])' + escapeRegExp(needle) + '([^a-z0-9]|$)').test(haystack);
  }
  return haystack.includes(needle);
}

function normalizePath(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '/';

  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://www.noithathungngoc.com');
    const path = url.pathname || '/';
    return path === '/' ? '/' : path.replace(/\/+$/g, '') + '/';
  } catch {
    const path = '/' + raw.replace(/^\/+|\/+$/g, '');
    return path === '/' ? '/' : path.replace(/\/+$/g, '') + '/';
  }
}

function parseHtmlLinks(html: string): HtmlLink[] {
  const links: HtmlLink[] = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(String(html || '')))) {
    links.push({
      href: normalizePath(match[1] || ''),
      text: stripHtml(match[2] || ''),
    });
  }

  return links;
}

function cleanSlug(value: unknown) {
  return normalizePath(String(value || '')).replace(/^\/+|\/+$/g, '');
}

function productKey(product: ProductSeoItem) {
  return String(product.id || product.slug || '');
}

function clusterCategorySlugs(cluster: SeoClusterConfig) {
  const configured = cluster.productCategories?.length
    ? cluster.productCategories
    : cluster.categorySlug
      ? [cluster.categorySlug]
      : [];
  return configured.map(cleanSlug).filter(Boolean);
}

function productCategorySlugs(product: ProductSeoItem) {
  return [product.category, product.parent_slug].map(cleanSlug).filter(Boolean);
}

function productMatchesClusterByCategory(product: ProductSeoItem, cluster: SeoClusterConfig) {
  const productSlugs = productCategorySlugs(product);
  const clusterSlugs = clusterCategorySlugs(cluster);
  if (!productSlugs.length || !clusterSlugs.length) return false;
  return productSlugs.some((slug) => clusterSlugs.includes(slug));
}

function productMatchesClusterByKeywordFallback(product: ProductSeoItem, cluster: SeoClusterConfig) {
  if (productCategorySlugs(product).length) return false;
  return matchesClusterIdentity(readProductIdentityText(product), cluster);
}

function productUrl(product: ProductSeoItem) {
  return normalizePath('/san-pham/' + String(product.slug || '').replace(/^\/+|\/+$/g, ''));
}

function blogUrl(blog: SeoBlogQualityItem) {
  return normalizePath('/tin-tuc/' + String(blog.slug || '').replace(/^\/+|\/+$/g, ''));
}

function readProductIdentityText(product: ProductSeoItem) {
  return [
    product.name,
    product.slug,
    product.category,
    product.parent_slug,
    product.description,
  ].join(' ');
}

function readProductLinkHtml(product: ProductSeoItem) {
  return [
    product.description,
    product.detailDescription,
    JSON.stringify(product.features || ''),
    JSON.stringify(product.specs || ''),
  ].join(' ');
}

function readBlogIdentityText(blog: SeoBlogQualityItem) {
  return [blog.title, blog.slug, blog.excerpt].join(' ');
}

function readBlogLinkHtml(blog: SeoBlogQualityItem) {
  return blog.content || '';
}

const BROAD_BLOG_KEYWORDS = new Set(['nội thất', 'noi that', 'văn phòng', 'van phong', 'giá rẻ', 'gia re', 'đẹp', 'dep', 'hà nội', 'ha noi', 'sản phẩm', 'san pham', 'mẫu', 'mau', 'mua', 'bán', 'ban']);

function clusterIncludeKeywords(cluster: SeoClusterConfig) {
  return cluster.includeKeywords?.length ? cluster.includeKeywords : cluster.matchKeywords;
}

function matchesClusterIdentity(text: string, cluster: SeoClusterConfig) {
  const includeKeywords = clusterIncludeKeywords(cluster);
  const excludeKeywords = cluster.excludeKeywords || [];
  const hasInclude = includeKeywords.some((keyword) => keywordInText(text, keyword));
  const hasExclude = excludeKeywords.some((keyword) => keywordInText(text, keyword));
  return hasInclude && !hasExclude;
}

function blogIncludeKeywords(cluster: SeoClusterConfig) {
  return clusterIncludeKeywords(cluster).filter((keyword) => !BROAD_BLOG_KEYWORDS.has(normalize(keyword)));
}

function matchesClusterBlogText(text: string, cluster: SeoClusterConfig) {
  const includeKeywords = blogIncludeKeywords(cluster);
  const excludeKeywords = cluster.excludeKeywords || [];
  if (!includeKeywords.length) return false;
  const hasInclude = includeKeywords.some((keyword) => keywordInText(text, keyword));
  const hasExclude = excludeKeywords.some((keyword) => keywordInText(text, keyword));
  return hasInclude && !hasExclude;
}

function blogMatchesClusterByContentFallback(blog: SeoBlogQualityItem, cluster: SeoClusterConfig) {
  return matchesClusterBlogText(stripHtml(readBlogLinkHtml(blog)), cluster);
}

function blogMatchSource(blog: SeoBlogQualityItem, cluster: SeoClusterConfig): BlogMatchSource | null {
  if (getMainAnchors(readBlogLinkHtml(blog), cluster).length) return 'main-link';
  if (matchesClusterBlogText(readBlogIdentityText(blog), cluster)) return 'identity';
  if (blogMatchesClusterByContentFallback(blog, cluster)) return 'content';
  return null;
}

function blogMatchSourceLabel(source?: BlogMatchSource) {
  if (source === 'main-link') return 'Link về trang chính';
  if (source === 'identity') return 'Title/slug/excerpt';
  if (source === 'content') return 'Content keyword fallback';
  return '-';
}

function mainUrlPaths(cluster: SeoClusterConfig) {
  return [cluster.mainUrl, cluster.fallbackMainUrl].filter(Boolean).map((url) => normalizePath(String(url)));
}

function getMainAnchors(html: string, cluster: SeoClusterConfig) {
  const paths = mainUrlPaths(cluster);
  return parseHtmlLinks(html).filter((link) => paths.includes(link.href)).map((link) => link.text).filter(Boolean);
}

function displayAnchors(anchors: string[]) {
  if (!anchors.length) return '-';
  if (anchors.length === 1) return anchors[0];
  return anchors[0] + ' +' + String(anchors.length - 1);
}

function productSupportPaths(products: ProductSeoItem[]) {
  return products.map((product) => productUrl(product));
}

function hasClusterProductLink(html: string, productPaths: string[]) {
  if (!productPaths.length) return false;
  return parseHtmlLinks(html).some((link) => productPaths.includes(link.href));
}

function findKeywordForUrl(keywords: SeoKeyword[], url: string, cluster: SeoClusterConfig) {
  const cleanUrl = normalizePath(url);
  const exact = keywords.find((keyword) => normalizePath(keyword.target_url || '') === cleanUrl);
  if (exact?.keyword) return exact.keyword;

  const tracked = cluster.trackedKeywords.find((keyword) => normalize(url).includes(normalize(keyword)));
  return tracked || '';
}

function hasUrlSignal(url: string, products: ProductSeoItem[], blogs: SeoBlogQualityItem[], keywords: SeoKeyword[], clusters: SeoCluster[]) {
  const cleanUrl = normalizePath(url);
  const slug = cleanUrl.replace(/^\/+|\/+$/g, '');
  if (keywords.some((keyword) => normalizePath(keyword.target_url || '') === cleanUrl)) return true;
  if (clusters.some((cluster) => normalizePath(cluster.main_url || '') === cleanUrl)) return true;
  if (products.some((product) => normalize([product.category, product.parent_slug, product.slug].join(' ')).includes(normalize(slug)))) return true;
  if (blogs.some((blog) => blogUrl(blog) === cleanUrl)) return true;
  return false;
}

function statusForBadge(status: ClusterStatus): 'ok' | 'pending' | 'warning' {
  if (status === 'Tốt') return 'ok';
  if (status === 'Theo dõi' || status === 'Cần kiểm tra' || status === 'Cần kiểm tra trùng từ khóa') return 'pending';
  return 'warning';
}

function baseStatus(issues: string[], cluster: SeoClusterConfig): ClusterStatus {
  if (cluster.priority >= 4 && issues.length) return 'Theo dõi';
  if (issues.includes('Cần kiểm tra trùng từ khóa')) return 'Cần kiểm tra trùng từ khóa';
  if (issues.includes('Có nguy cơ trùng từ khóa')) return 'Có nguy cơ trùng từ khóa';
  if (issues.includes('Thiếu link về trang chính')) return 'Thiếu link';
  if (issues.length) return 'Cần kiểm tra';
  return 'Tốt';
}

function buildRows(
  cluster: SeoClusterConfig,
  products: ProductSeoItem[],
  blogs: SeoBlogQualityItem[],
  keywords: SeoKeyword[],
  seoClusters: SeoCluster[],
) {
  const rows: ClusterRow[] = [];
  const mainUrlExists = hasUrlSignal(cluster.mainUrl, products, blogs, keywords, seoClusters);
  const mainIssues = mainUrlExists ? [] : ['Cần kiểm tra URL trang chính'];

  rows.push({
    id: 'category-' + cluster.id,
    type: 'danh mục',
    title: cluster.name,
    url: cluster.mainUrl,
    identityText: cluster.name,
    linkHtml: '',
    primaryKeyword: findKeywordForUrl(keywords, cluster.mainUrl, cluster) || cluster.trackedKeywords[0] || 'Chưa gán',
    hasMainLink: true,
    mainAnchors: ['Trang chính'],
    mainAnchor: 'Trang chính',
    hasProductLink: true,
    contentLength: 0,
    issues: mainIssues,
    status: baseStatus(mainIssues, cluster),
  });

  const categoryMatchedProducts = products.filter((product) => productMatchesClusterByCategory(product, cluster));
  const categoryMatchedKeys = new Set(categoryMatchedProducts.map(productKey));
  const keywordFallbackProducts = products.filter((product) => !categoryMatchedKeys.has(productKey(product)) && productMatchesClusterByKeywordFallback(product, cluster));
  const matchedProducts = [...categoryMatchedProducts, ...keywordFallbackProducts];
  const productMatchSourceByKey = new Map<string, 'category' | 'keyword'>();
  categoryMatchedProducts.forEach((product) => productMatchSourceByKey.set(productKey(product), 'category'));
  keywordFallbackProducts.forEach((product) => productMatchSourceByKey.set(productKey(product), 'keyword'));
  const supportPaths = productSupportPaths(matchedProducts);

  matchedProducts.forEach((product) => {
    const url = productUrl(product);
    const linkHtml = readProductLinkHtml(product);
    const textLength = stripHtml(linkHtml).length;
    const issues: string[] = [];
    const anchors = getMainAnchors(linkHtml, cluster);
    const mainLink = anchors.length > 0;

    if (!mainLink) issues.push('Thiếu link về trang chính');
    if (textLength < 300) issues.push('Nội dung mỏng');

    rows.push({
      id: 'product-' + String(product.id || product.slug),
      type: 'sản phẩm',
      title: product.name || product.slug || 'Sản phẩm',
      url,
      identityText: readProductIdentityText(product),
      linkHtml,
      primaryKeyword: findKeywordForUrl(keywords, url, cluster),
      hasMainLink: mainLink,
      mainAnchors: anchors,
      mainAnchor: displayAnchors(anchors),
      hasProductLink: true,
      contentLength: textLength,
      issues,
      status: baseStatus(issues, cluster),
      productMatchSource: productMatchSourceByKey.get(productKey(product)) || 'keyword',
    });
  });

  blogs.forEach((blog) => {
    const matchSource = blogMatchSource(blog, cluster);
    if (!matchSource) return;

    const url = blogUrl(blog);
    const linkHtml = readBlogLinkHtml(blog);
    const textLength = stripHtml(linkHtml).length;
    const issues: string[] = [];
    const anchors = getMainAnchors(linkHtml, cluster);
    const mainLink = anchors.length > 0;
    const productLink = hasClusterProductLink(linkHtml, supportPaths);

    if (!mainLink) issues.push('Thiếu link về trang chính');
    if (textLength < 700) issues.push('Nội dung mỏng');
    if (!productLink) issues.push('Thiếu link sản phẩm hỗ trợ');
    if (matchSource === 'content') issues.push('Cần kiểm tra content fallback');

    rows.push({
      id: 'blog-' + String(blog.id || blog.slug),
      type: 'tin tức',
      title: blog.title || blog.slug || 'Bài viết',
      url,
      identityText: readBlogIdentityText(blog),
      linkHtml,
      primaryKeyword: findKeywordForUrl(keywords, url, cluster),
      hasMainLink: mainLink,
      mainAnchors: anchors,
      mainAnchor: displayAnchors(anchors),
      hasProductLink: productLink,
      contentLength: textLength,
      issues,
      status: matchSource === 'content' ? 'Cần kiểm tra' : baseStatus(issues, cluster),
      blogMatchSource: matchSource,
    });
  });

  const keywordCounts = new Map<string, number>();
  const anchorCounts = new Map<string, number>();

  rows.forEach((row) => {
    cluster.trackedKeywords.forEach((keyword) => {
      const key = normalize(keyword);
      if (key && keywordInText(row.identityText, keyword)) keywordCounts.set(key, (keywordCounts.get(key) || 0) + 1);
    });
    row.mainAnchors.forEach((anchor) => {
      const anchorKey = normalize(anchor);
      if (anchorKey && anchorKey !== normalize('Trang chính')) anchorCounts.set(anchorKey, (anchorCounts.get(anchorKey) || 0) + 1);
    });
  });

  return rows.map((row) => {
    const issues = [...row.issues];
    if (cluster.trackedKeywords.some((keyword) => keywordInText(row.identityText, keyword) && (keywordCounts.get(normalize(keyword)) || 0) > 1)) {
      issues.push(row.type === 'tin tức' ? 'Cần kiểm tra trùng từ khóa' : 'Có nguy cơ trùng từ khóa');
    }
    if (row.mainAnchors.some((anchor) => (anchorCounts.get(normalize(anchor)) || 0) > 2)) issues.push('Anchor bị lặp');
    const uniqueIssues = Array.from(new Set(issues));
    return {
      ...row,
      primaryKeyword: row.primaryKeyword || 'Chưa gán',
      issues: uniqueIssues,
      status: row.type === 'tin tức' && row.blogMatchSource === 'content' ? 'Cần kiểm tra' : row.type === 'danh mục' && !uniqueIssues.length ? 'Tốt' : baseStatus(uniqueIssues, cluster),
    };
  });
}

export default function SeoClusterCheck({
  products,
  blogs,
  keywords,
  clusters,
}: {
  products: ProductSeoItem[];
  blogs: SeoBlogQualityItem[];
  keywords: SeoKeyword[];
  clusters: SeoCluster[];
}) {
  const [groupId, setGroupId] = useState(SEO_CLUSTER_GROUPS[0]?.groupId || '');
  const currentGroup = SEO_CLUSTER_GROUPS.find((group) => group.groupId === groupId) || SEO_CLUSTER_GROUPS[0];
  const [clusterId, setClusterId] = useState(currentGroup?.clusters[0]?.id || '');
  const selectedCluster = currentGroup?.clusters.find((cluster) => cluster.id === clusterId) || currentGroup?.clusters[0];

  const rows = useMemo(() => selectedCluster ? buildRows(selectedCluster, products, blogs, keywords, clusters) : [], [blogs, clusters, keywords, products, selectedCluster]);
  const productRows = rows.filter((row) => row.type !== 'tin tức');
  const relatedProducts = rows.filter((row) => row.type === 'sản phẩm');
  const relatedBlogs = rows.filter((row) => row.type === 'tin tức');
  const summary = {
    total: rows.length,
    totalProductsScanned: products.length,
    productCategoryMatched: relatedProducts.filter((row) => row.productMatchSource === 'category').length,
    productKeywordFallback: relatedProducts.filter((row) => row.productMatchSource === 'keyword').length,
    productMissingMain: relatedProducts.filter((row) => row.issues.includes('Thiếu link về trang chính')).length,
    totalBlogsScanned: blogs.length,
    relatedBlogs: relatedBlogs.length,
    blogMainLinkMatched: relatedBlogs.filter((row) => row.blogMatchSource === 'main-link').length,
    blogIdentityMatched: relatedBlogs.filter((row) => row.blogMatchSource === 'identity').length,
    blogContentFallback: relatedBlogs.filter((row) => row.blogMatchSource === 'content').length,
    blogMissingMain: relatedBlogs.filter((row) => row.issues.includes('Thiếu link về trang chính')).length,
    missingMain: rows.filter((row) => row.issues.includes('Thiếu link về trang chính')).length,
    duplicateKeyword: rows.filter((row) => row.issues.includes('Có nguy cơ trùng từ khóa') || row.issues.includes('Cần kiểm tra trùng từ khóa')).length,
    missingProductLink: rows.filter((row) => row.issues.includes('Thiếu link sản phẩm hỗ trợ')).length,
  };

  function changeGroup(nextGroupId: string) {
    const nextGroup = SEO_CLUSTER_GROUPS.find((group) => group.groupId === nextGroupId) || SEO_CLUSTER_GROUPS[0];
    setGroupId(nextGroup.groupId);
    setClusterId(nextGroup.clusters[0]?.id || '');
  }

  if (!selectedCluster || !currentGroup) {
    return <EmptyState title="Chưa có cấu hình cụm SEO" detail="Kiểm tra file seoClustersConfig.ts." />;
  }

  return (
    <div className={styles.clusterCheckStack}>
      <section className={styles.clusterCheckToolbar}>
        <label>
          <span>Nhóm lớn</span>
          <select value={currentGroup.groupId} onChange={(event) => changeGroup(event.target.value)}>
            {SEO_CLUSTER_GROUPS.map((group) => <option value={group.groupId} key={group.groupId}>{group.groupName}</option>)}
          </select>
        </label>
        <label>
          <span>Cụm con</span>
          <select value={selectedCluster.id} onChange={(event) => setClusterId(event.target.value)}>
            {currentGroup.clusters.map((cluster) => <option value={cluster.id} key={cluster.id}>{cluster.name}</option>)}
          </select>
        </label>
      </section>

      <section className={styles.metricGridSmall}>
        <MetricCard label="Trang chính" value={selectedCluster.mainUrl} hint={selectedCluster.fallbackMainUrl ? 'Fallback: ' + selectedCluster.fallbackMainUrl : undefined} />
        <MetricCard label="Độ ưu tiên SEO" value={priorityLabel(selectedCluster.priority)} />
        <MetricCard label="Tổng sản phẩm đã quét" value={summary.totalProductsScanned} />
        <MetricCard label="Sản phẩm liên quan" value={relatedProducts.length} />
        <MetricCard label="Bài viết liên quan" value={relatedBlogs.length} />
      </section>

      <section className={styles.metricGridSmall}>
        <MetricCard label="URL trong cụm" value={summary.total} />
        <MetricCard label="Thiếu link về trang chính" value={summary.missingMain} />
        <MetricCard label="Nguy cơ trùng từ khóa" value={summary.duplicateKeyword} />
        <MetricCard label="Thiếu link sản phẩm hỗ trợ" value={summary.missingProductLink} />
        <MetricCard label="Sản phẩm theo category" value={summary.productCategoryMatched} />
        <MetricCard label="Sản phẩm keyword fallback" value={summary.productKeywordFallback} />
        <MetricCard label="Sản phẩm thiếu link trang chính" value={summary.productMissingMain} />
        <MetricCard label="Tổng bài viết đã quét" value={summary.totalBlogsScanned} />
        <MetricCard label="Bài viết nhận bằng link" value={summary.blogMainLinkMatched} />
        <MetricCard label="Bài viết nhận bằng title/slug/excerpt" value={summary.blogIdentityMatched} />
        <MetricCard label="Bài viết content fallback" value={summary.blogContentFallback} />
        <MetricCard label="Bài viết thiếu link trang chính" value={summary.blogMissingMain} />
      </section>

      <section className={styles.gridTwo}>
        <ModuleCard title="Từ khóa đang theo dõi" description="Dùng để đối chiếu nguy cơ trùng keyword, không tự động ghi dữ liệu.">
          <div className={styles.clusterPillGrid}>{selectedCluster.trackedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
        </ModuleCard>
        <ModuleCard title="Anchor an toàn gợi ý" description="Copy thủ công khi cần thêm link nội bộ về trang chính của cụm.">
          <div className={styles.clusterPillGrid}>{selectedCluster.safeAnchors.map((anchor) => <span key={anchor}>{anchor}</span>)}</div>
        </ModuleCard>
      </section>

      <ModuleCard title="Sản phẩm liên quan" description="Sản phẩm thuộc cụm được nhận diện chính bằng category hoặc parent_slug. Keyword chỉ dùng fallback khi sản phẩm thiếu category/parent_slug. Link/anchor được kiểm tra riêng bằng thẻ a.">
        {productRows.length ? (
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
                {productRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td><strong>{row.title}</strong><small className={styles.clusterMutedLine}>{row.contentLength ? String(row.contentLength) + ' ký tự nội dung' : 'Trang chính'}{row.productMatchSource ? ' · Nguồn: ' + (row.productMatchSource === 'category' ? 'category' : 'keyword fallback') : ''}</small></td>
                    <td><a className={styles.link} href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
                    <td>{row.primaryKeyword}</td>
                    <td>{row.hasMainLink ? <Badge status="ok">Có</Badge> : <Badge status="warning">Thiếu</Badge>}</td>
                    <td>{row.mainAnchor}</td>
                    <td>{row.hasProductLink ? <Badge status="ok">Có</Badge> : <Badge status="pending">Cần bổ sung</Badge>}</td>
                    <td>
                      <Badge status={statusForBadge(row.status)}>{row.status}</Badge>
                      {row.issues.length ? <ul className={styles.clusterIssueList}>{row.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Chưa thấy sản phẩm liên quan" detail="Cụm này có thể chưa có sản phẩm chứa includeKeywords trong các trường nhận diện." />}
      </ModuleCard>

      <ModuleCard title="Bài viết tin tức liên quan" description="Bài viết được nhận diện theo thứ tự: có thẻ a trỏ về trang chính, title/slug/excerpt chứa keyword, hoặc content keyword fallback có lọc exclude.">
        {relatedBlogs.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề bài viết</th>
                  <th>Slug / URL</th>
                  <th>Độ dài content</th>
                  <th>Lý do nhận diện</th>
                  <th>Có link về trang chính không</th>
                  <th>Anchor đang dùng</th>
                  <th>Có link sang sản phẩm liên quan không</th>
                  <th>Trạng thái gợi ý</th>
                </tr>
              </thead>
              <tbody>
                {relatedBlogs.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td><a className={styles.link} href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
                    <td>{row.contentLength} ký tự</td>
                    <td>{blogMatchSourceLabel(row.blogMatchSource)}</td>
                    <td>{row.hasMainLink ? <Badge status="ok">Có</Badge> : <Badge status="warning">Thiếu</Badge>}</td>
                    <td>{row.mainAnchor}</td>
                    <td>{row.hasProductLink ? <Badge status="ok">Có</Badge> : <Badge status="pending">Cần bổ sung</Badge>}</td>
                    <td>
                      <Badge status={statusForBadge(row.status)}>{row.status}</Badge>
                      {row.issues.length ? <ul className={styles.clusterIssueList}>{row.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Chưa thấy bài viết tin tức liên quan" detail="Không có bài blog_posts nào có link về trang chính hoặc chứa includeKeywords của cụm." />}
      </ModuleCard>

      <ModuleCard title="Checklist 7 ngày cho cụm đang chọn" description="Làm thủ công từng URL, ưu tiên 1-3 URL có tín hiệu hoặc cảnh báo rõ nhất.">
        <ul className={styles.clusterChecklist}>
          <li>Kiểm tra link về trang chính {selectedCluster.mainUrl}.</li>
          <li>Kiểm tra link sang sản phẩm hỗ trợ nếu là bài viết tư vấn.</li>
          <li>Kiểm tra trùng từ khóa với URL khác trong cùng cụm.</li>
          <li>Kiểm tra anchor bị lặp và xoay vòng bằng danh sách anchor gợi ý.</li>
          <li>Chọn 1-3 URL cần sửa trước, không sửa hàng loạt.</li>
          <li>Ghi trạng thái sau khi sửa vào nhật ký SEO.</li>
          <li>Sau khi submit index, chờ Google đọc lại 7 ngày rồi mới đánh giá tiếp.</li>
        </ul>
      </ModuleCard>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard } from './Ui';
import { SEO_CLUSTER_GROUPS, priorityLabel, type SeoClusterConfig } from '../seoClustersConfig';
import type { ProductSeoItem, SeoBlogQualityItem, SeoKeyword, SeoCluster } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type ClusterStatus = 'Tốt' | 'Thiếu link' | 'Có nguy cơ trùng từ khóa' | 'Cần kiểm tra' | 'Theo dõi';
type ClusterRowType = 'danh mục' | 'sản phẩm' | 'tin tức';

type ClusterRow = {
  id: string;
  type: ClusterRowType;
  title: string;
  url: string;
  text: string;
  primaryKeyword: string;
  hasMainLink: boolean;
  mainAnchor: string;
  hasProductLink: boolean;
  contentLength: number;
  issues: string[];
  status: ClusterStatus;
};

const PRODUCT_LINK_PATTERN = /\/san-pham\/|hn\d{2,}/i;

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

function readProductText(product: ProductSeoItem) {
  return [
    product.name,
    product.slug,
    product.category,
    product.parent_slug,
    product.description,
    product.detailDescription,
    JSON.stringify(product.features || ''),
    JSON.stringify(product.specs || ''),
  ].join(' ');
}

function readBlogText(blog: SeoBlogQualityItem) {
  return [blog.title, blog.slug, blog.excerpt, blog.content].join(' ');
}

function matchesCluster(text: string, cluster: SeoClusterConfig) {
  const haystack = normalize(text);
  return cluster.matchKeywords.some((keyword) => haystack.includes(normalize(keyword)));
}

function hasMainLink(html: string, mainUrl: string, fallbackMainUrl?: string) {
  const text = normalize(html);
  const mainPath = pathOnly(mainUrl);
  const fallbackPath = fallbackMainUrl ? pathOnly(fallbackMainUrl) : '';
  return text.includes(mainPath) || Boolean(fallbackPath && text.includes(fallbackPath));
}

function extractAnchorToMain(html: string, mainUrl: string, fallbackMainUrl?: string) {
  const mainPath = pathOnly(mainUrl);
  const fallbackPath = fallbackMainUrl ? pathOnly(fallbackMainUrl) : '';
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const hrefPath = pathOnly(match[1] || '');
    if (hrefPath === mainPath || (fallbackPath && hrefPath === fallbackPath)) return stripHtml(match[2] || '');
  }

  return hasMainLink(html, mainUrl, fallbackMainUrl) ? 'Có link nhưng chưa đọc được anchor' : '';
}

function hasProductLink(html: string) {
  return PRODUCT_LINK_PATTERN.test(html);
}

function findKeywordForUrl(keywords: SeoKeyword[], url: string, cluster: SeoClusterConfig) {
  const cleanUrl = pathOnly(url);
  const exact = keywords.find((keyword) => pathOnly(keyword.target_url || '') === cleanUrl);
  if (exact?.keyword) return exact.keyword;

  const tracked = cluster.trackedKeywords.find((keyword) => normalize(url).includes(normalize(keyword)));
  return tracked || '';
}

function hasUrlSignal(url: string, products: ProductSeoItem[], blogs: SeoBlogQualityItem[], keywords: SeoKeyword[], clusters: SeoCluster[]) {
  const cleanUrl = pathOnly(url);
  const slug = cleanUrl.replace(/^\/+|\/+$/g, '');
  if (keywords.some((keyword) => pathOnly(keyword.target_url || '') === cleanUrl)) return true;
  if (clusters.some((cluster) => pathOnly(cluster.main_url || '') === cleanUrl)) return true;
  if (products.some((product) => normalize([product.category, product.parent_slug, product.slug].join(' ')).includes(normalize(slug)))) return true;
  if (blogs.some((blog) => pathOnly(blogUrl(blog)) === cleanUrl)) return true;
  return false;
}

function statusForBadge(status: ClusterStatus): 'ok' | 'pending' | 'warning' {
  if (status === 'Tốt') return 'ok';
  if (status === 'Theo dõi' || status === 'Cần kiểm tra') return 'pending';
  return 'warning';
}

function baseStatus(issues: string[], cluster: SeoClusterConfig): ClusterStatus {
  if (cluster.priority >= 4 && issues.length) return 'Theo dõi';
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
    text: cluster.name,
    primaryKeyword: findKeywordForUrl(keywords, cluster.mainUrl, cluster) || cluster.trackedKeywords[0] || 'Chưa gán',
    hasMainLink: true,
    mainAnchor: 'Trang chính',
    hasProductLink: true,
    contentLength: 0,
    issues: mainIssues,
    status: baseStatus(mainIssues, cluster),
  });

  products
    .filter((product) => matchesCluster(readProductText(product), cluster))
    .forEach((product) => {
      const url = productUrl(product);
      const html = readProductText(product);
      const textLength = stripHtml(html).length;
      const issues: string[] = [];
      const mainLink = hasMainLink(html, cluster.mainUrl, cluster.fallbackMainUrl);
      const productLink = hasProductLink(html);

      if (!mainLink) issues.push('Thiếu link về trang chính');
      if (textLength < 300) issues.push('Nội dung mỏng');

      rows.push({
        id: 'product-' + String(product.id || product.slug),
        type: 'sản phẩm',
        title: product.name || product.slug || 'Sản phẩm',
        url,
        text: html,
        primaryKeyword: findKeywordForUrl(keywords, url, cluster),
        hasMainLink: mainLink,
        mainAnchor: extractAnchorToMain(html, cluster.mainUrl, cluster.fallbackMainUrl),
        hasProductLink: productLink,
        contentLength: textLength,
        issues,
        status: baseStatus(issues, cluster),
      });
    });

  blogs
    .filter((blog) => matchesCluster(readBlogText(blog), cluster))
    .forEach((blog) => {
      const url = blogUrl(blog);
      const html = [blog.excerpt, blog.content].join(' ');
      const textLength = stripHtml(html).length;
      const issues: string[] = [];
      const mainLink = hasMainLink(html, cluster.mainUrl, cluster.fallbackMainUrl);
      const productLink = hasProductLink(html);

      if (!mainLink) issues.push('Thiếu link về trang chính');
      if (textLength < 700) issues.push('Nội dung mỏng');
      if (!productLink) issues.push('Thiếu link sản phẩm hỗ trợ');

      rows.push({
        id: 'blog-' + String(blog.id || blog.slug),
        type: 'tin tức',
        title: blog.title || blog.slug || 'Bài viết',
        url,
        text: html,
        primaryKeyword: findKeywordForUrl(keywords, url, cluster),
        hasMainLink: mainLink,
        mainAnchor: extractAnchorToMain(html, cluster.mainUrl, cluster.fallbackMainUrl),
        hasProductLink: productLink,
        contentLength: textLength,
        issues,
        status: baseStatus(issues, cluster),
      });
    });

  const keywordCounts = new Map<string, number>();
  const anchorCounts = new Map<string, number>();

  rows.forEach((row) => {
    const text = normalize(row.text);
    cluster.trackedKeywords.forEach((keyword) => {
      const key = normalize(keyword);
      if (key && text.includes(key)) keywordCounts.set(key, (keywordCounts.get(key) || 0) + 1);
    });
    const anchorKey = normalize(row.mainAnchor);
    if (anchorKey && anchorKey !== normalize('Trang chính')) anchorCounts.set(anchorKey, (anchorCounts.get(anchorKey) || 0) + 1);
  });

  return rows.map((row) => {
    const issues = [...row.issues];
    const text = normalize(row.text);
    if (cluster.trackedKeywords.some((keyword) => text.includes(normalize(keyword)) && (keywordCounts.get(normalize(keyword)) || 0) > 1)) {
      issues.push('Có nguy cơ trùng từ khóa');
    }
    const anchorKey = normalize(row.mainAnchor);
    if (anchorKey && (anchorCounts.get(anchorKey) || 0) > 2) issues.push('Anchor bị lặp, nên xoay vòng');
    const uniqueIssues = Array.from(new Set(issues));
    return {
      ...row,
      primaryKeyword: row.primaryKeyword || 'Chưa gán',
      issues: uniqueIssues,
      status: row.type === 'danh mục' && !uniqueIssues.length ? 'Tốt' : baseStatus(uniqueIssues, cluster),
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
  const relatedProducts = rows.filter((row) => row.type === 'sản phẩm');
  const relatedBlogs = rows.filter((row) => row.type === 'tin tức');
  const summary = {
    total: rows.length,
    missingMain: rows.filter((row) => row.issues.includes('Thiếu link về trang chính')).length,
    duplicateKeyword: rows.filter((row) => row.issues.includes('Có nguy cơ trùng từ khóa')).length,
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
        <MetricCard label="Sản phẩm liên quan" value={relatedProducts.length} />
        <MetricCard label="Bài viết liên quan" value={relatedBlogs.length} />
      </section>

      <section className={styles.metricGridSmall}>
        <MetricCard label="URL trong cụm" value={summary.total} />
        <MetricCard label="Thiếu link về trang chính" value={summary.missingMain} />
        <MetricCard label="Nguy cơ trùng từ khóa" value={summary.duplicateKeyword} />
        <MetricCard label="Thiếu link sản phẩm hỗ trợ" value={summary.missingProductLink} />
      </section>

      <section className={styles.gridTwo}>
        <ModuleCard title="Từ khóa đang theo dõi" description="Dùng để đối chiếu nguy cơ trùng keyword, không tự động ghi dữ liệu.">
          <div className={styles.clusterPillGrid}>{selectedCluster.trackedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
        </ModuleCard>
        <ModuleCard title="Anchor an toàn gợi ý" description="Copy thủ công khi cần thêm link nội bộ về trang chính của cụm.">
          <div className={styles.clusterPillGrid}>{selectedCluster.safeAnchors.map((anchor) => <span key={anchor}>{anchor}</span>)}</div>
        </ModuleCard>
      </section>

      <ModuleCard title="Danh sách URL liên quan" description="Chỉ hiển thị cảnh báo/gợi ý. Không tự sửa sản phẩm, bài viết, slug hoặc canonical.">
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
                    <td><strong>{row.title}</strong><small className={styles.clusterMutedLine}>{row.contentLength ? String(row.contentLength) + ' ký tự nội dung' : 'Trang chính'}</small></td>
                    <td><a className={styles.link} href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
                    <td>{row.primaryKeyword}</td>
                    <td>{row.hasMainLink ? <Badge status="ok">Có</Badge> : <Badge status="warning">Thiếu</Badge>}</td>
                    <td>{row.mainAnchor || '-'}</td>
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
        ) : <EmptyState title="Chưa tìm thấy URL liên quan" detail="Cụm này có thể chưa có sản phẩm hoặc bài viết chứa matchKeywords trong dashboard." />}
      </ModuleCard>

      <section className={styles.gridTwo}>
        <ModuleCard title="Sản phẩm liên quan" description="Lấy theo matchKeywords trong name, slug, category, parent_slug, description và detailDescription.">
          {relatedProducts.length ? <div className={styles.clusterCompactList}>{relatedProducts.slice(0, 12).map((row) => <a href={row.url} target="_blank" rel="noreferrer" key={row.id}>{row.title}</a>)}</div> : <EmptyState title="Chưa thấy sản phẩm liên quan" />}
        </ModuleCard>
        <ModuleCard title="Bài viết liên quan" description="Lấy theo matchKeywords trong title, slug, excerpt và content.">
          {relatedBlogs.length ? <div className={styles.clusterCompactList}>{relatedBlogs.slice(0, 12).map((row) => <a href={row.url} target="_blank" rel="noreferrer" key={row.id}>{row.title}</a>)}</div> : <EmptyState title="Chưa thấy bài viết liên quan" />}
        </ModuleCard>
      </section>

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

import type {
  GoogleAdsImportData,
  GoogleAdsKeywordImportRow,
  ProductSeoItem,
  SearchConsoleQuery,
  SeoBlogQualityItem,
  SeoCluster,
  SeoKeyword,
  SeoLog,
} from '../../seo/types/seo';
import {
  evaluateGoogleAdsRules,
  type AdsRuleEvaluation,
  type AdsRuleSource,
  type GoogleAdsRuleEngineInput,
  type GoogleAdsRuleEngineResult,
} from '../rules';

export type { AdsRuleEvaluation, AdsRuleSource, AdsRuleStatus, GoogleAdsRuleEngineResult } from '../rules';

export const GOOGLE_ADS_IMPORT_STORE_KEY = 'noithathungngoc-google-ads-import-v1';
export const GOOGLE_ADS_AI_PLAN_STORE_KEY = 'noithathungngoc-google-ads-ai-plan-v1';
export const GOOGLE_ADS_AI_HISTORY_STORE_KEY = 'noithathungngoc-google-ads-ai-history-v1';
export const GOOGLE_ADS_ACCOUNT_HISTORY_STORE_KEY = 'noithathungngoc-google-ads-account-history-v1';
export const GSC_QUERY_PAGE_STORE_KEY = 'noithathungngoc-search-console-query-pages-v1';
export const GSC_IMPORT_STORE_KEY = 'noithathungngoc-search-console-import-v1';
export const SEO_WORK_LOG_STORE_KEY = 'noithathungngoc-seo-work-log-v11';
export const SEO_KEYWORD_MAP_STORE_KEY = 'noithathungngoc-seo-keyword-map-v1';

export const GSC_QUERY_PAGE_RANGE_KEYS = ['7d', '28d', '3m', '6m', '12m'] as const;

export type AdsPlannerDecision = 'run-now' | 'test-small-budget' | 'seo-first' | 'do-not-run';
export type AdsAccountStatus = 'Hoạt động bình thường' | 'Chiến dịch tạm dừng' | 'Quảng cáo bị từ chối' | 'Bị giới hạn bởi chính sách' | 'Chờ xác minh nhà quảng cáo' | 'Lỗi thanh toán' | 'Tài khoản bị đình chỉ' | 'Tài khoản bị hủy' | 'Không xác định';
export type AdsDiagnosticConfidence = 'Cao' | 'Trung bình' | 'Thấp' | 'Chưa đủ dữ liệu';
export type AdsWizardStepStatus = 'chưa làm' | 'đang làm' | 'đã xác nhận' | 'cần bằng chứng';

export const ADS_ACCOUNT_STATUS_OPTIONS: AdsAccountStatus[] = [
  'Hoạt động bình thường',
  'Chiến dịch tạm dừng',
  'Quảng cáo bị từ chối',
  'Bị giới hạn bởi chính sách',
  'Chờ xác minh nhà quảng cáo',
  'Lỗi thanh toán',
  'Tài khoản bị đình chỉ',
  'Tài khoản bị hủy',
  'Không xác định',
];

export interface AdsAccountHistory {
  previousRunStartDate: string | null;
  previousRunEndDate: string | null;
  daysRun: number | null;
  dailyBudget: number | null;
  estimatedSpend: number | null;
  actualSpend: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  averageCpc: number | null;
  conversions: number | null;
  conversionValue: number | null;
  phoneCalls: number | null;
  zaloContacts: number | null;
  formSubmissions: number | null;
  orders: number | null;
  warningMessage: string;
  warningDate: string | null;
  accountStatus: AdsAccountStatus;
  billingStatus: string;
  advertiserVerificationStatus: string;
  policyStatus: string;
  campaignStatus: string;
  conversionTrackingStatus: string;
  evidenceSource: string;
  notes: string;
  updatedAt: string;
}

export interface AdsDiagnosticItem {
  id: string;
  title: string;
  status: 'blocked' | 'warning' | 'ok' | 'unknown';
  ruleId: string;
  ruleSource: AdsRuleSource;
  evidence: string;
  confidence: AdsDiagnosticConfidence;
  missingData: string[];
  recommendedCheck: string;
  allowedAction: string;
  forbiddenAction: string;
}

export interface AdsFunnelDiagnostic {
  id: string;
  stage: string;
  possibleCause: string;
  evidence: string;
  confidence: AdsDiagnosticConfidence;
  missingData: string[];
  recommendedCheck: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
}

export interface AdsReadinessScore {
  total: number;
  classification: 'Không chạy Ads' | 'Chỉ sửa và kiểm tra' | 'Có thể lập kế hoạch test nhỏ' | 'Đủ điều kiện test có kiểm soát';
  canLaunch: boolean;
  launchMessage: string;
  categories: Array<{ id: string; label: string; maxScore: number; score: number; evidence: string }>;
  hardBlockers: string[];
  missingData: string[];
  ruleEvaluations: AdsRuleEvaluation[];
}

export interface AdsWizardStep {
  id: string;
  index: number;
  vietnameseName: string;
  englishTerm: string;
  goal: string;
  googleAdsLocation: string;
  shouldChoose: string;
  shouldAvoid: string;
  reason: string;
  requiredInput: string[];
  warning: string;
  completionCriteria: string;
  status: AdsWizardStepStatus;
}

export interface AdsSearchCampaignGuide {
  defaultMode: string;
  structure: string[];
  network: string[];
  targeting: string[];
  bidding: Array<{ strategy: string; explanation: string; whenToUse: string; warning: string }>;
  keywordRules: string[];
  copyRules: string[];
}

export interface AdsAssetChecklistItem {
  asset: string;
  instruction: string;
  evidenceNeeded: string;
  status: 'Chưa có dữ liệu' | 'Cần kiểm tra' | 'Chỉ dùng khi xác nhận';
}

export interface AdsPlannerKeywordDecision {
  id: string;
  keyword: string;
  decision: AdsPlannerDecision;
  score: number;
  avgMonthlySearches: number;
  cpc: number | null;
  competition: string;
  finalUrl: string;
  landingPageTitle: string;
  campaignName: string;
  adGroupName: string;
  matchTypes: Array<'exact' | 'phrase'>;
  reason: string;
  risk: string;
  source: string;
  gscPosition: number | null;
  gscImpressions: number;
  gscCtr: number | null;
  savedPrimaryUrl?: string;
  suggestedPrimaryUrl?: string;
  competingUrls?: string[];
  urlStatus?: 'Đã xác nhận URL' | 'Chờ xác nhận URL' | 'Chưa có URL';
  adGroupId?: string;
}

export interface AdsPlannerNegativeKeyword {
  keyword: string;
  reason: string;
  source: string;
}

export interface AdsPlannerAdGroup {
  id: string;
  campaignName: string;
  adGroupName: string;
  finalUrl: string;
  landingPageTitle: string;
  keywordCount: number;
  exactKeywords: string[];
  phraseKeywords: string[];
  negativeKeywords: string[];
  reason: string;
  warnings: string[];
  headlines: string[];
  descriptions: string[];
  urlStatus: 'Đã xác nhận URL' | 'Chờ xác nhận URL' | 'Chưa có URL';
  budgetStatus: 'Bật ưu tiên' | 'Bật test' | 'Chưa bật - chờ dữ liệu';
  dailyBudgetHint: string;
  dailyBudgetAmount: number;
}

export interface AdsPlannerLandingWarning {
  url: string;
  title: string;
  warning: string;
  source: string;
}

export interface AdsPlannerActionTask {
  id: string;
  title: string;
  reason: string;
  keywords: string[];
  finalUrl: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  estimatedTime: string;
  copyTask: string;
}

export interface AdsPlannerCampaignPlan {
  campaignName: string;
  reason: string;
  budgetHint: string;
  adGroups: Array<{
    adGroupName: string;
    finalUrl: string;
    keywordCount: number;
    exactKeywords: string[];
    phraseKeywords: string[];
    negativeKeywords: string[];
    riskWarnings: string[];
    urlStatus: AdsPlannerAdGroup['urlStatus'];
    budgetStatus: AdsPlannerAdGroup['budgetStatus'];
    dailyBudgetHint: string;
  }>;
}

export interface AdsPlannerBudgetSuggestion {
  totalDailyBudgetHint: string;
  highPriorityBudget: string;
  testBudget: string;
  recommendation: string;
  groupBudgets: Array<{ campaignName: string; adGroupName: string; finalUrl: string; dailyBudgetHint: string; dailyBudgetAmount: number; budgetStatus: AdsPlannerAdGroup['budgetStatus']; reason: string }>;
}

export interface AdsPlannerMatchTypeKeywordBlock {
  adGroupName: string;
  finalUrl: string;
  exactKeywords: string[];
  phraseKeywords: string[];
  copyText: string;
  urlStatus: AdsPlannerAdGroup['urlStatus'];
  dailyBudgetHint: string;
}

export interface AdsPlannerAdCopyBlock {
  adGroupName: string;
  finalUrl: string;
  headlines: string[];
  descriptions: string[];
  copyText: string;
  headlineLengths: number[];
  descriptionLengths: number[];
  warnings: string[];
}

export interface GoogleAdsAiPlan {
  version: string;
  generatedAt: string;
  source: 'manual-run';
  sourceSummary: {
    googleAdsKeywordCount: number;
    googleAdsUpdatedAt: string | null;
    gscQueryPageRows: number;
    gscRanges: Array<{ rangeKey: string; rowCount: number; updatedAt: string | null; source: string }>;
    products: number;
    blogPosts: number;
    clusters: number;
    seoKeywords: number;
    workLogs: number;
    keywordMap: number;
    notes: string[];
  };
  counts: {
    runNow: number;
    testSmallBudget: number;
    seoFirst: number;
    doNotRun: number;
    negativeKeywords: number;
    adGroups: number;
  };
  runNow: AdsPlannerKeywordDecision[];
  testSmallBudget: AdsPlannerKeywordDecision[];
  seoFirst: AdsPlannerKeywordDecision[];
  doNotRun: AdsPlannerKeywordDecision[];
  negativeKeywords: AdsPlannerNegativeKeyword[];
  adGroups: AdsPlannerAdGroup[];
  actionPlanToday: AdsPlannerActionTask[];
  campaignPlan: AdsPlannerCampaignPlan[];
  budgetSuggestion: AdsPlannerBudgetSuggestion;
  matchTypeKeywords: AdsPlannerMatchTypeKeywordBlock[];
  adCopies: AdsPlannerAdCopyBlock[];
  landingPageWarnings: AdsPlannerLandingWarning[];
  followUpChecklist: string[];
  accountHistory: AdsAccountHistory;
  ruleEvaluations: AdsRuleEvaluation[];
  ruleEngineResult: GoogleAdsRuleEngineResult;
  accountPolicyDiagnostics: AdsDiagnosticItem[];
  conversionDiagnostics: AdsDiagnosticItem[];
  funnelDiagnostics: AdsFunnelDiagnostic[];
  readinessScore: AdsReadinessScore;
  launchWizard: AdsWizardStep[];
  searchCampaignGuide: AdsSearchCampaignGuide;
  assetChecklist: AdsAssetChecklistItem[];
  remediationPlan: string[];
  conditionalTestPlan: string[];
  missingManualData: string[];
  copyBlocks: {
    actionPlanToday: string;
    runKeywords: string;
    negativeKeywords: string;
    campaignStructure: string;
    matchTypeKeywords: string;
    adCopy: string;
    followUpChecklist: string;
  };
}

export interface GoogleAdsAiHistoryItem {
  id: string;
  generatedAt: string;
  totalKeywords: number;
  runAdsCount: number;
  testAdsCount: number;
  seoFirstCount: number;
  negativeCount: number;
  campaignCount: number;
}

export interface GoogleAdsAiHistory {
  version: string;
  updatedAt: string;
  items: GoogleAdsAiHistoryItem[];
}

export interface GoogleAdsPlannerInput {
  googleAds: GoogleAdsImportData | null;
  searchConsoleRows: SearchConsoleQuery[];
  gscRanges: GoogleAdsAiPlan['sourceSummary']['gscRanges'];
  products: Array<Partial<ProductSeoItem>>;
  blogs: Array<Partial<SeoBlogQualityItem>>;
  clusters: Array<Partial<SeoCluster>>;
  seoKeywords: Array<Partial<SeoKeyword>>;
  workLogs: Array<Partial<SeoLog> & Record<string, unknown>>;
  keywordMap: unknown;
  accountHistory?: AdsAccountHistory | null;
}

type KeywordMapEntry = {
  keyword: string;
  savedPrimaryUrl?: string;
  primaryUrl?: string;
  suggestedPrimaryUrl?: string;
  urls?: string[];
};

type CategoryRule = {
  id: string;
  label: string;
  url: string;
  terms: string[];
  campaignName: string;
  adGroupName: string;
};

const CATEGORY_RULES: CategoryRule[] = [
  { id: 'ban-nhan-vien', label: 'Bàn nhân viên', url: '/ban-nhan-vien/', terms: ['ban nhan vien', 'ban lam viec nhan vien', 'ban van phong nhan vien'], campaignName: 'Bàn văn phòng', adGroupName: 'Bàn nhân viên' },
  { id: 'ban-giam-doc', label: 'Bàn giám đốc', url: '/ban-giam-doc/', terms: ['ban giam doc', 'ban lanh dao'], campaignName: 'Bàn văn phòng', adGroupName: 'Bàn giám đốc' },
  { id: 'ban-hop', label: 'Bàn họp', url: '/ban-hop/', terms: ['ban hop', 'ban phong hop'], campaignName: 'Bàn văn phòng', adGroupName: 'Bàn họp' },
  { id: 'ban-chan-sat', label: 'Bàn chân sắt', url: '/ban-chan-sat/', terms: ['ban chan sat', 'ban chan sat van phong'], campaignName: 'Bàn văn phòng', adGroupName: 'Bàn chân sắt' },
  { id: 'ghe-chan-quy', label: 'Ghế chân quỳ', url: '/ghe-chan-quy/', terms: ['ghe chan quy', 'ghe quy'], campaignName: 'Ghế văn phòng', adGroupName: 'Ghế chân quỳ' },
  { id: 'ghe-xoay', label: 'Ghế xoay', url: '/ghe-xoay/', terms: ['ghe xoay', 'ghe xoay van phong'], campaignName: 'Ghế văn phòng', adGroupName: 'Ghế xoay' },
  { id: 'ghe-giam-doc', label: 'Ghế giám đốc', url: '/ghe-giam-doc/', terms: ['ghe giam doc', 'ghe lanh dao'], campaignName: 'Ghế văn phòng', adGroupName: 'Ghế giám đốc' },
  { id: 'giuong-tang-sat', label: 'Giường tầng sắt', url: '/giuong-tang-sat/', terms: ['giuong tang sat', 'giuong sat 2 tang', 'giuong tang ky tuc xa'], campaignName: 'Giường tầng sắt', adGroupName: 'Giường tầng sắt' },
  { id: 'tu-locker', label: 'Tủ locker', url: '/tu-locker/', terms: ['tu locker', 'tu do locker', 'tu sat locker'], campaignName: 'Tủ văn phòng', adGroupName: 'Tủ locker' },
  { id: 'tu-tai-lieu-sat', label: 'Tủ tài liệu sắt', url: '/tu-tai-lieu-sat/', terms: ['tu tai lieu sat', 'tu sat van phong'], campaignName: 'Tủ văn phòng', adGroupName: 'Tủ tài liệu sắt' },
  { id: 'tu-tai-lieu-go', label: 'Tủ tài liệu gỗ', url: '/tu-tai-lieu-go/', terms: ['tu tai lieu go', 'tu go van phong'], campaignName: 'Tủ văn phòng', adGroupName: 'Tủ tài liệu gỗ' },
  { id: 'ban-ghe-hoc-sinh', label: 'Bàn ghế học sinh', url: '/ban-ghe-hoc-sinh/', terms: ['ban ghe hoc sinh', 'ban hoc sinh', 'ghe hoc sinh'], campaignName: 'Trường học', adGroupName: 'Bàn ghế học sinh' },
  { id: 'ke-de-hang', label: 'Kệ để hàng', url: '/ke-de-hang/', terms: ['ke de hang', 'ke sat de hang', 'ke kho'], campaignName: 'Kệ sắt', adGroupName: 'Kệ để hàng' },
];

const NEGATIVE_TERMS = [
  'cu', 'thanh ly', 'mien phi', 'free', 'pdf', 'file', 'ban ve', 'tu lam', 'diy', 'sua chua', 'tuyen dung',
  'viec lam', 'shopee', 'lazada', 'ikea', 'cach lam', 'hinh anh', 'download', 'second hand', 'cũ', 'thanh lý',
];

const COMMERCIAL_TERMS = ['mua', 'gia', 'bao gia', 'ha noi', 'hcm', 'tphcm', 'ban buon', 'dat hang', 'noi that', 'van phong', 'giao hang', 'xuong'];
const LOW_BUY_INTENT_TERMS = ['mau dep', 'hinh anh', 'kich thuoc tieu chuan', 'cach chon', 'review', 'y tuong'];
const WRONG_INTENT_TERMS = ['gaming', 'game', 'gamer'];
const BRAND_TERMS = ['hoa phat'];
const INITIAL_TOTAL_DAILY_BUDGET = 120000;
const MAIN_GROUP_BUDGET = 80000;
const TEST_GROUP_BUDGET = 40000;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9/ -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompetition(value: unknown, index?: number) {
  const text = normalizeText(value);
  if (text.includes('cao') || text.includes('high')) return 'High';
  if (text.includes('thap') || text.includes('low')) return 'Low';
  if (text.includes('trung') || text.includes('medium')) return 'Medium';
  if (typeof index === 'number' && Number.isFinite(index) && index > 0) {
    if (index >= 67) return 'High';
    if (index >= 34) return 'Medium';
    return 'Low';
  }
  return value ? String(value) : 'Unknown';
}

function normalizeGoogleAdsKeyword(value: unknown) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}


function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeGoogleAdsKeyword(term)));
}

function hasBuyingIntent(keyword: string) {
  return includesAny(normalizeGoogleAdsKeyword(keyword), COMMERCIAL_TERMS);
}

function isLowBuyingIntent(keyword: string) {
  return includesAny(normalizeGoogleAdsKeyword(keyword), LOW_BUY_INTENT_TERMS);
}

function hasUnconfirmedBrand(keyword: string, input: GoogleAdsPlannerInput) {
  const normalized = normalizeGoogleAdsKeyword(keyword);
  const brand = BRAND_TERMS.find((term) => normalized.includes(normalizeGoogleAdsKeyword(term)));
  if (!brand) return false;
  const seoKeywordRows = input.seoKeywords as Array<Record<string, unknown>>;
  const haystack = [
    ...input.products.map((item) => [item.name, item.slug, item.category, item.parent_slug, item.description, item.detailDescription].filter(Boolean).join(' ')),
    ...input.blogs.map((item) => [item.title, item.slug, item.excerpt, item.content].filter(Boolean).join(' ')),
    ...seoKeywordRows.map((item) => [item.keyword, item.url, item.cluster].filter(Boolean).join(' ')),
  ].map(normalizeGoogleAdsKeyword).join(' ');
  return !haystack.includes(normalizeGoogleAdsKeyword(brand));
}

function ruleDirectnessScore(keyword: string, rule: CategoryRule) {
  const normalized = normalizeGoogleAdsKeyword(keyword);
  if (includesAny(normalized, WRONG_INTENT_TERMS)) return 0;
  if (rule.id === 'ghe-chan-quy') {
    if (!normalized.includes('ghe chan quy') && !normalized.includes('ghe quy')) return 0;
    if (normalized.includes('gaming') || normalized.includes('ghe xoay') || normalized.includes('ghe giam doc')) return 0;
    return 95;
  }
  if (rule.id === 'ghe-giam-doc') {
    if (!normalized.includes('ghe giam doc') && !normalized.includes('ghe lanh dao')) return 0;
    if (normalized.includes('ghe chan quy') || normalized.includes('ghe xoay')) return 0;
    return 95;
  }
  if (rule.id === 'ghe-xoay') {
    if (!normalized.includes('ghe xoay')) return 0;
    if (normalized.includes('ghe chan quy') || normalized.includes('ghe giam doc')) return 0;
    return 92;
  }
  if (rule.id === 'giuong-tang-sat') {
    if (!normalized.includes('giuong tang') && !normalized.includes('giuong sat 2 tang')) return 0;
    return 94;
  }
  return rule.terms.some((term) => normalized.includes(normalizeGoogleAdsKeyword(term))) ? 80 : 0;
}

function adGroupId(campaignName: string, adGroupName: string, finalUrl: string) {
  return normalizeGoogleAdsKeyword([campaignName, adGroupName, cleanPath(finalUrl)].join(' ')).replace(/\s+/g, '-');
}

function dedupeMatchKeywords(keywords: string[], adGroupKey: string) {
  const seen = new Set<string>();
  return keywords.filter((keyword) => {
    const normalized = normalizeGoogleAdsKeyword(keyword.replace(/[\[\]"]/g, ''));
    const matchType = keyword.startsWith('[') ? 'exact' : keyword.startsWith('"') ? 'phrase' : 'unknown';
    const key = adGroupKey + '|' + matchType + '|' + normalized;
    if (!normalized || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function confirmedUrlStatus(savedPrimaryUrl: string, rule: CategoryRule | null, contentUrl: string, suggestedPrimaryUrl: string): AdsPlannerKeywordDecision['urlStatus'] {
  if (savedPrimaryUrl || rule || contentUrl) return 'Đã xác nhận URL';
  if (suggestedPrimaryUrl) return 'Chờ xác nhận URL';
  return 'Chưa có URL';
}

function cleanPath(value: unknown) {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    return url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
  } catch {
    const path = '/' + text.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');
    return path.endsWith('/') ? path : path + '/';
  }
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function normalizePlannerPayload(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    return parsed === value ? value : normalizePlannerPayload(parsed, depth + 1);
  }
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (typeof record.raw === 'string' && record.raw.trim()) return normalizePlannerPayload(record.raw, depth + 1);
  if (Object.prototype.hasOwnProperty.call(record, 'value')) return normalizePlannerPayload(record.value, depth + 1);
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nested = record.data as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(nested, 'raw') || Object.prototype.hasOwnProperty.call(nested, 'value') || Object.prototype.hasOwnProperty.call(nested, 'aggregateData')) {
      return normalizePlannerPayload(nested, depth + 1);
    }
  }
  if (typeof record.data === 'string' && record.data.trim()) return normalizePlannerPayload(record.data, depth + 1);
  if (Object.prototype.hasOwnProperty.call(record, 'aggregateData')) return normalizePlannerPayload(record.aggregateData, depth + 1);
  return value;
}

export function getQueryPageRangeStoreKey(rangeKey: string) {
  return GSC_QUERY_PAGE_STORE_KEY + '__range__' + rangeKey;
}

function findGoogleAdsRows(value: unknown, depth = 0): unknown[] {
  if (depth > 6 || value == null) return [];
  const normalized = normalizePlannerPayload(value);
  if (Array.isArray(normalized)) return normalized;
  if (!normalized || typeof normalized !== 'object') return [];
  const record = normalized as Record<string, unknown>;
  const directRows = Array.isArray(record.rows) ? record.rows : Array.isArray(record.keywords) ? record.keywords : Array.isArray(record.items) ? record.items : [];
  if (directRows.length) return directRows;
  return findGoogleAdsRows(record.data || record.value || record.aggregateData, depth + 1);
}

function normalizeGoogleAdsRow(value: unknown, index: number): GoogleAdsKeywordImportRow | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const keyword = String(row.keyword || row.Keyword || row.query || row.term || row['Từ khóa'] || '').trim();
  if (!keyword) return null;
  const lowBid = toNumber(row.low_top_of_page_bid || row.lowTopOfPageBid || row.top_of_page_bid_low_range || row.cpc || row.CPC, 0);
  const highBid = toNumber(row.high_top_of_page_bid || row.highTopOfPageBid || row.top_of_page_bid_high_range, 0);
  const cpc = toNumber(row.cpc || row.CPC || lowBid || highBid, 0);
  const competitionIndex = toNumber(row.competition_index || row.competitionIndex || row['Competition index'], 0);
  const cluster = String(row.cluster || '').trim();
  const matchedRule = matchCategoryRule(keyword);
  const normalized: GoogleAdsKeywordImportRow = {
    id: String(row.id || 'ads-row-' + index + '-' + normalizeGoogleAdsKeyword(keyword).replace(/s+/g, '-')),
    keyword,
    avg_monthly_searches: toNumber(row.avg_monthly_searches || row.avgMonthlySearches || row.average_monthly_searches || row.monthly_searches || row.search_volume || row['Avg. monthly searches'], 0),
    competition: String(row.competition || row.Competition || normalizeCompetition(row.competition, competitionIndex) || 'Unknown'),
    competition_index: competitionIndex || undefined,
    low_top_of_page_bid: lowBid || undefined,
    high_top_of_page_bid: highBid || undefined,
    cpc: cpc || undefined,
    currency: String(row.currency || row.Currency || 'VND'),
    ad_impression_share: toNumber(row.ad_impression_share || row.adImpressionShare, 0) || undefined,
    organic_impression_share: toNumber(row.organic_impression_share || row.organicImpressionShare, 0) || undefined,
    organic_average_position: toNumber(row.organic_average_position || row.organicAveragePosition, 0) || undefined,
    monthlySearches: row.monthlySearches as GoogleAdsKeywordImportRow['monthlySearches'],
    campaign: row.campaign ? String(row.campaign) : undefined,
    ad_group: row.ad_group ? String(row.ad_group) : undefined,
    clicks: toNumber(row.clicks || row.Clicks, 0) || undefined,
    impressions: toNumber(row.impressions || row.Impressions, 0) || undefined,
    ctr: toNumber(row.ctr || row.CTR, 0) || undefined,
    cost: toNumber(row.cost || row.Cost, 0) || undefined,
    conversions: toNumber(row.conversions || row.Conversions, 0) || undefined,
    conversion_rate: toNumber(row.conversion_rate || row.conversionRate, 0) || undefined,
    cluster: cluster || String(row.cluster || matchedRule?.label || 'Theo dõi thêm'),
    parentCluster: String(row.parentCluster || matchedRule?.campaignName || ''),
    subCluster: String(row.subCluster || matchedRule?.id || ''),
    clusterReason: String(row.clusterReason || (matchedRule ? 'Khớp danh mục Ads Planner' : 'Chưa khớp danh mục')),
    businessPriority: toNumber(row.businessPriority, matchedRule ? 70 : 45),
    commercialIntent: toNumber(row.commercialIntent, commercialIntentScore(keyword, row as unknown as GoogleAdsKeywordImportRow)),
  };
  return normalized;
}

function buildGoogleAdsSummary(rows: GoogleAdsKeywordImportRow[], existing?: Partial<GoogleAdsImportData['summary']>): GoogleAdsImportData['summary'] {
  const totalSearchVolume = rows.reduce((sum, row) => sum + Number(row.avg_monthly_searches || 0), 0);
  const cpcRows = rows.filter((row) => Number(row.cpc || row.low_top_of_page_bid || 0) > 0);
  const compRows = rows.filter((row) => Number(row.competition_index || 0) > 0);
  const totalClicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const totalImpressions = rows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const totalCost = rows.reduce((sum, row) => sum + Number(row.cost || 0), 0);
  const totalConversions = rows.reduce((sum, row) => sum + Number(row.conversions || 0), 0);
  return {
    keywordCount: rows.length,
    rawLineCount: Number(existing?.rawLineCount || rows.length),
    parsedRowCount: Number(existing?.parsedRowCount || rows.length),
    mergedKeywordCount: Number(existing?.mergedKeywordCount || rows.length),
    skippedRowCount: Number(existing?.skippedRowCount || 0),
    unclusteredKeywordCount: rows.filter((row) => !row.cluster || row.cluster === 'Theo dõi thêm').length,
    totalSearchVolume,
    averageCpc: cpcRows.length ? Number((cpcRows.reduce((sum, row) => sum + Number(row.cpc || row.low_top_of_page_bid || 0), 0) / cpcRows.length).toFixed(0)) : null,
    averageCompetitionIndex: compRows.length ? Number((compRows.reduce((sum, row) => sum + Number(row.competition_index || 0), 0) / compRows.length).toFixed(1)) : null,
    totalClicks,
    totalImpressions,
    totalCost,
    totalConversions,
    hasAdsPerformance: totalClicks > 0 || totalImpressions > 0 || totalCost > 0 || totalConversions > 0,
    lastUpdated: String(existing?.lastUpdated || new Date().toISOString()),
    headerRowNumber: existing?.headerRowNumber ?? null,
    detectedColumns: Array.isArray(existing?.detectedColumns) ? existing.detectedColumns : [],
    clusterCounts: existing?.clusterCounts || {},
    subClusterCounts: existing?.subClusterCounts || {},
    importDebug: existing?.importDebug,
  };
}

export function extractGoogleAdsImport(value: unknown): GoogleAdsImportData | null {
  const normalized = normalizePlannerPayload(value);
  const record = normalized && typeof normalized === 'object' && !Array.isArray(normalized) ? normalized as Partial<GoogleAdsImportData> & Record<string, unknown> : null;
  const rows = findGoogleAdsRows(normalized)
    .map((row, index) => normalizeGoogleAdsRow(row, index))
    .filter((row): row is GoogleAdsKeywordImportRow => Boolean(row));
  if (!rows.length) return null;
  const summary = buildGoogleAdsSummary(rows, record?.summary as Partial<GoogleAdsImportData['summary']> | undefined);
  const sorted = [...rows].sort((a, b) => Number(b.avg_monthly_searches || 0) - Number(a.avg_monthly_searches || 0));
  return {
    source: 'import',
    lastUpdated: String(record?.lastUpdated || summary.lastUpdated || new Date().toISOString()),
    rows,
    summary,
    topVolume: Array.isArray(record?.topVolume) && record.topVolume.length ? record.topVolume as GoogleAdsKeywordImportRow[] : sorted.slice(0, 30),
    lowCpcGoodVolume: Array.isArray(record?.lowCpcGoodVolume) ? record.lowCpcGoodVolume as GoogleAdsKeywordImportRow[] : [],
    lowCompetition: Array.isArray(record?.lowCompetition) ? record.lowCompetition as GoogleAdsKeywordImportRow[] : rows.filter((row) => String(row.competition || '').toLowerCase().includes('low')).slice(0, 30),
    highCommercial: Array.isArray(record?.highCommercial) ? record.highCommercial as GoogleAdsKeywordImportRow[] : rows.filter((row) => Number(row.commercialIntent || 0) >= 70).slice(0, 30),
    shouldSeo: Array.isArray(record?.shouldSeo) ? record.shouldSeo as GoogleAdsImportData['shouldSeo'] : [],
    shouldAds: Array.isArray(record?.shouldAds) ? record.shouldAds as GoogleAdsImportData['shouldAds'] : [],
    shouldWatch: Array.isArray(record?.shouldWatch) ? record.shouldWatch as GoogleAdsImportData['shouldWatch'] : [],
    wasteKeywords: Array.isArray(record?.wasteKeywords) ? record.wasteKeywords as GoogleAdsKeywordImportRow[] : [],
    lowCtrKeywords: Array.isArray(record?.lowCtrKeywords) ? record.lowCtrKeywords as GoogleAdsKeywordImportRow[] : [],
    highCpcKeywords: Array.isArray(record?.highCpcKeywords) ? record.highCpcKeywords as GoogleAdsKeywordImportRow[] : [],
    goodConversionKeywords: Array.isArray(record?.goodConversionKeywords) ? record.goodConversionKeywords as GoogleAdsKeywordImportRow[] : [],
    highImpressionLowClickKeywords: Array.isArray(record?.highImpressionLowClickKeywords) ? record.highImpressionLowClickKeywords as GoogleAdsKeywordImportRow[] : [],
    adGroupsToOptimize: Array.isArray(record?.adGroupsToOptimize) ? record.adGroupsToOptimize as GoogleAdsImportData['adGroupsToOptimize'] : [],
    opportunities: Array.isArray(record?.opportunities) ? record.opportunities as GoogleAdsImportData['opportunities'] : [],
    matrix: Array.isArray(record?.matrix) ? record.matrix as GoogleAdsImportData['matrix'] : [],
    sources: Array.isArray(record?.sources) ? record.sources as GoogleAdsImportData['sources'] : [],
    lastImportedAt: String(record?.lastImportedAt || record?.lastUpdated || summary.lastUpdated),
  };
}

function normalizeGscRow(row: Record<string, unknown>): SearchConsoleQuery | null {
  const keys = Array.isArray(row.keys) ? row.keys : [];
  const query = String(row.query || row.Query || row['Truy vấn'] || keys[0] || '').trim();
  const page = cleanPath(row.page || row.Page || row['Trang'] || keys[1] || '');
  if (!query && !page) return null;
  return {
    query,
    page,
    clicks: toNumber(row.clicks || row.Clicks || row['Lượt nhấp']),
    impressions: toNumber(row.impressions || row.Impressions || row['Lượt hiển thị']),
    ctr: toNumber(row.ctr || row.CTR),
    position: toNumber(row.position || row.Position || row['Vị trí']),
  };
}

export function extractSearchConsoleRows(value: unknown, limit = 4000): SearchConsoleQuery[] {
  const normalized = normalizePlannerPayload(value);
  const rows: unknown[] = [];
  const visit = (candidate: unknown, depth = 0) => {
    if (depth > 4 || rows.length >= limit) return;
    const current = normalizePlannerPayload(candidate);
    if (Array.isArray(current)) {
      current.slice(0, limit - rows.length).forEach((item) => rows.push(item));
      return;
    }
    if (!current || typeof current !== 'object') return;
    const record = current as Record<string, unknown>;
    [record.queries, record.rows, record.items, record.data, record.aggregateData].forEach((child) => visit(child, depth + 1));
  };
  visit(normalized);
  const cleanRows = rows
    .map((row) => normalizeGscRow((row || {}) as Record<string, unknown>))
    .filter((row): row is SearchConsoleQuery => Boolean(row?.query));
  return cleanRows
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.position - b.position)
    .slice(0, limit);
}

export function countKeywordMap(value: unknown) {
  return extractKeywordMapEntries(value).length;
}

function extractKeywordMapEntries(value: unknown): KeywordMapEntry[] {
  const normalized = normalizePlannerPayload(value);
  const rawItems = Array.isArray(normalized)
    ? normalized
    : normalized && typeof normalized === 'object'
      ? Array.isArray((normalized as Record<string, unknown>).items)
        ? (normalized as Record<string, unknown>).items as unknown[]
        : Array.isArray((normalized as Record<string, unknown>).keywords)
          ? (normalized as Record<string, unknown>).keywords as unknown[]
          : Object.values(normalized as Record<string, unknown>)
      : [];
  return rawItems
    .map((item) => {
      const record = (item || {}) as Record<string, unknown>;
      return {
        keyword: String(record.keyword || record.query || record.term || '').trim(),
        savedPrimaryUrl: cleanPath(record.savedPrimaryUrl || record.primaryUrl || record.url || ''),
        primaryUrl: cleanPath(record.primaryUrl || ''),
        suggestedPrimaryUrl: cleanPath(record.suggestedPrimaryUrl || ''),
        urls: Array.isArray(record.urls) ? record.urls.map(cleanPath).filter(Boolean) : [],
      };
    })
    .filter((item) => item.keyword);
}

function findKeywordMap(keyword: string, entries: KeywordMapEntry[]) {
  const normalized = normalizeGoogleAdsKeyword(keyword);
  return entries.find((item) => normalizeGoogleAdsKeyword(item.keyword) === normalized)
    || entries.find((item) => normalized.includes(normalizeGoogleAdsKeyword(item.keyword)) || normalizeGoogleAdsKeyword(item.keyword).includes(normalized));
}

function matchCategoryRule(keyword: string) {
  const matches = CATEGORY_RULES
    .map((rule) => ({ rule, score: ruleDirectnessScore(keyword, rule) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches[0]?.rule || null;
}

function productUrl(product: Partial<ProductSeoItem>) {
  const slug = String(product.slug || '').trim();
  return slug ? '/san-pham/' + slug.replace(/^\/+|\/+$/g, '') + '/' : '';
}

function blogUrl(blog: Partial<SeoBlogQualityItem>) {
  const slug = String(blog.slug || '').trim();
  return slug ? '/tin-tuc/' + slug.replace(/^\/+|\/+$/g, '') + '/' : '';
}

function matchContentUrl(keyword: string, products: Array<Partial<ProductSeoItem>>, blogs: Array<Partial<SeoBlogQualityItem>>) {
  const normalized = normalizeText(keyword);
  const product = products.find((item) => {
    const haystack = normalizeText([item.name, item.slug, item.category, item.parent_slug].filter(Boolean).join(' '));
    return haystack && (normalized.includes(haystack) || haystack.includes(normalized) || normalized.split(' ').some((word) => word.length > 3 && haystack.includes(word)));
  });
  if (product) return { url: productUrl(product), title: String(product.name || product.slug || 'Sản phẩm phù hợp') };
  const blog = blogs.find((item) => {
    const haystack = normalizeText([item.title, item.slug, item.excerpt].filter(Boolean).join(' '));
    return haystack && normalized.split(' ').filter((word) => word.length > 3 && haystack.includes(word)).length >= 2;
  });
  if (blog) return { url: blogUrl(blog), title: String(blog.title || blog.slug || 'Bài viết phù hợp') };
  return null;
}

function gscBestByQuery(rows: SearchConsoleQuery[]) {
  const map = new Map<string, SearchConsoleQuery>();
  rows.forEach((row) => {
    const key = normalizeGoogleAdsKeyword(row.query);
    if (!key) return;
    const current = map.get(key);
    if (!current || row.impressions > current.impressions || (row.impressions === current.impressions && row.position < current.position)) map.set(key, row);
  });
  return map;
}

function findGscSignal(keyword: string, map: Map<string, SearchConsoleQuery>) {
  const key = normalizeGoogleAdsKeyword(keyword);
  return map.get(key)
    || Array.from(map.entries()).find(([query]) => query.includes(key) || key.includes(query))?.[1]
    || null;
}

function competingUrls(keyword: string, rows: SearchConsoleQuery[], savedPrimaryUrl = '') {
  const key = normalizeGoogleAdsKeyword(keyword);
  const pages = new Map<string, number>();
  rows.forEach((row) => {
    if (normalizeGoogleAdsKeyword(row.query) !== key) return;
    const page = cleanPath(row.page || '');
    if (!page || page === savedPrimaryUrl) return;
    pages.set(page, (pages.get(page) || 0) + Number(row.impressions || 0));
  });
  return Array.from(pages.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([page]) => page);
}

function workLogHint(keyword: string, finalUrl: string, logs: GoogleAdsPlannerInput['workLogs']) {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedUrl = cleanPath(finalUrl);
  const matched = logs
    .filter((log) => {
      const logKeyword = normalizeText(log.keyword || log.target || log.title || '');
      const logUrl = cleanPath(log.related_url || log.url || log.target || '');
      return (normalizedUrl && logUrl === normalizedUrl) || (normalizedKeyword && logKeyword.includes(normalizedKeyword));
    })
    .sort((a, b) => String(b.log_date || b.created_at || '').localeCompare(String(a.log_date || a.created_at || '')))[0];
  if (!matched) return '';
  return 'Nhật ký SEO gần nhất: ' + [matched.log_date || matched.created_at, matched.type || matched.action, matched.status || matched.action].filter(Boolean).join(' - ');
}

function isNegativeKeyword(keyword: string) {
  const normalized = normalizeText(keyword);
  return NEGATIVE_TERMS.some((term) => normalized.includes(normalizeText(term)));
}

function commercialIntentScore(keyword: string, row: GoogleAdsKeywordImportRow) {
  const normalized = normalizeText(keyword);
  const termScore = COMMERCIAL_TERMS.filter((term) => normalized.includes(term)).length * 8;
  return clamp(Number(row.commercialIntent || 0) + termScore + Number(row.businessPriority || 0) * 4);
}

function classifyKeyword(row: GoogleAdsKeywordImportRow, input: GoogleAdsPlannerInput, gscMap: Map<string, SearchConsoleQuery>, keywordMap: KeywordMapEntry[]): AdsPlannerKeywordDecision {
  const keyword = row.keyword;
  const rule = matchCategoryRule(keyword);
  const saved = findKeywordMap(keyword, keywordMap);
  const gsc = findGscSignal(keyword, gscMap);
  const contentMatch = matchContentUrl(keyword, input.products, input.blogs);
  const savedPrimaryUrl = cleanPath(saved?.savedPrimaryUrl || saved?.primaryUrl || '');
  const contentUrl = cleanPath(contentMatch?.url || '');
  const suggestedPrimaryUrl = savedPrimaryUrl ? '' : cleanPath(saved?.suggestedPrimaryUrl || gsc?.page || '');
  const finalUrl = savedPrimaryUrl || rule?.url || contentUrl || suggestedPrimaryUrl || '';
  const urlStatus = confirmedUrlStatus(savedPrimaryUrl, rule, contentUrl, suggestedPrimaryUrl);
  const landingPageTitle = rule?.label || contentMatch?.title || (finalUrl ? 'Chờ xác nhận URL' : 'Chưa có landing page');
  const avgMonthlySearches = toNumber(row.avg_monthly_searches);
  const cpc = row.cpc ?? row.high_top_of_page_bid ?? row.low_top_of_page_bid ?? null;
  const gscPosition = gsc?.position && Number.isFinite(gsc.position) ? Number(gsc.position) : null;
  const gscCtr = gsc?.ctr != null && Number.isFinite(gsc.ctr) ? Number(gsc.ctr) : null;
  const gscImpressions = Number(gsc?.impressions || 0);
  const intent = commercialIntentScore(keyword, row);
  const noLanding = !finalUrl || (!rule && !contentMatch && !savedPrimaryUrl && !suggestedPrimaryUrl);
  const negative = isNegativeKeyword(keyword);
  const wrongIntent = includesAny(normalizeGoogleAdsKeyword(keyword), WRONG_INTENT_TERMS);
  const unconfirmedBrand = hasUnconfirmedBrand(keyword, input);
  const lowBuyingIntent = isLowBuyingIntent(keyword);
  let score = Math.min(60, Math.log10(avgMonthlySearches + 10) * 18) + intent * 0.35 + (rule ? 14 : 0) + (savedPrimaryUrl ? 10 : 0);
  let decision: AdsPlannerDecision = 'test-small-budget';
  const reasons: string[] = [];
  const risks: string[] = [];

  if (negative || wrongIntent || unconfirmedBrand) {
    decision = 'do-not-run';
    score = 5;
    if (wrongIntent) reasons.push('Keyword khác ý định mua nội thất văn phòng/nhà trọ, không đưa vào ad group sản phẩm chính.');
    else if (unconfirmedBrand) reasons.push('Keyword có thương hiệu chưa được dữ liệu sản phẩm xác nhận website đang bán, không tự dùng để chạy Ads.');
    else reasons.push('Keyword có dấu hiệu không tạo đơn hàng hoặc dễ lãng phí ngân sách.');
  } else if (noLanding) {
    decision = 'do-not-run';
    score = Math.min(score, 35);
    reasons.push('Chưa tìm được landing page sản phẩm/danh mục đủ khớp để chạy Ads an toàn.');
    risks.push('Cần tạo hoặc xác nhận landing page trước khi chi tiền.');
  } else if (gscPosition && gscPosition <= 5 && (gscCtr ?? 0) >= 0.02) {
    decision = 'seo-first';
    score = Math.min(score, 58);
    reasons.push('SEO tự nhiên đang khá tốt, không nên đẩy Ads mạnh nếu ngân sách nhỏ.');
  } else if (gscPosition && gscPosition >= 4 && gscPosition <= 10 && (gscCtr ?? 1) < 0.02) {
    decision = 'seo-first';
    score = Math.max(score, 64);
    reasons.push('Đang có vị trí 4-10 nhưng CTR thấp, nên sửa title/meta trước khi tăng ngân sách.');
  } else if (gscPosition && gscPosition > 10 && gscPosition <= 30) {
    decision = intent >= 45 && avgMonthlySearches >= 50 ? 'test-small-budget' : 'seo-first';
    score = Math.max(score, decision === 'test-small-budget' ? 72 : 62);
    reasons.push('SEO đang ở vị trí 10-30, phù hợp kết hợp tối ưu SEO và test Ads nhỏ.');
  } else if (lowBuyingIntent) {
    decision = 'test-small-budget';
    score = Math.min(score, 58);
    reasons.push('Keyword thiên về tham khảo, chỉ nên test nhỏ hoặc dùng làm SEO hỗ trợ, không ưu tiên cao.');
  } else if (!gsc && avgMonthlySearches >= 100 && intent >= 45 && hasBuyingIntent(keyword)) {
    decision = 'run-now';
    score = Math.max(score, 78);
    reasons.push('Keyword có volume/ý định thương mại nhưng chưa có tín hiệu GSC, có thể là cơ hội Ads.');
  } else if (avgMonthlySearches >= 80 && intent >= 55) {
    decision = 'run-now';
    score = Math.max(score, 76);
    reasons.push('Keyword đủ volume, ý định mua rõ và đã map được landing page.');
  } else if (avgMonthlySearches < 20 || intent < 25) {
    decision = 'seo-first';
    score = Math.min(score, 55);
    reasons.push('Volume hoặc ý định mua chưa đủ mạnh, ưu tiên SEO/content trước.');
  } else {
    reasons.push('Có tín hiệu thị trường nhưng nên test exact/phrase trước để kiểm soát ngân sách.');
  }

  if (urlStatus === 'Chờ xác nhận URL') risks.push('URL này mới là đề xuất từ GSC/AI, chưa coi là URL chính đã lưu.');
  if (cpc && cpc > 15000) risks.push('CPC cao, cần giới hạn ngân sách và theo dõi search terms hằng ngày.');
  const competitors = competingUrls(keyword, input.searchConsoleRows, savedPrimaryUrl);
  if (competitors.length > 1) risks.push('Có nhiều URL cùng nhận impression, cần kiểm tra trùng từ khóa trước khi chạy mạnh.');
  const logHint = workLogHint(keyword, finalUrl, input.workLogs);
  if (logHint) reasons.push(logHint);

  return {
    id: 'ads-plan-' + normalizeGoogleAdsKeyword(keyword).replace(/\s+/g, '-') + '-' + row.id,
    keyword,
    decision,
    score: clamp(score),
    avgMonthlySearches,
    cpc,
    competition: String(row.competition || 'unknown'),
    finalUrl,
    landingPageTitle,
    campaignName: rule?.campaignName || 'Google Ads Planner',
    adGroupName: rule?.adGroupName || String(row.ad_group || row.parentCluster || row.cluster || 'Keyword mở rộng'),
    matchTypes: ['exact', 'phrase'],
    reason: reasons.join(' '),
    risk: risks.join(' '),
    source: [row.avg_monthly_searches ? 'Keyword Planner' : '', gsc ? 'Search Console Query+Page' : '', savedPrimaryUrl ? 'Keyword map URL chính' : '', rule ? 'Rule danh mục' : '', logHint ? 'Nhật ký SEO v11' : ''].filter(Boolean).join(' + '),
    gscPosition,
    gscImpressions,
    gscCtr,
    savedPrimaryUrl: savedPrimaryUrl || undefined,
    suggestedPrimaryUrl: suggestedPrimaryUrl || undefined,
    competingUrls: competitors,
    urlStatus,
    adGroupId: adGroupId(rule?.campaignName || 'Google Ads Planner', rule?.adGroupName || String(row.ad_group || row.parentCluster || row.cluster || 'Keyword mở rộng'), finalUrl),
  };
}

function uniqueByKeyword(items: AdsPlannerKeywordDecision[]) {
  const map = new Map<string, AdsPlannerKeywordDecision>();
  items.forEach((item) => {
    const key = normalizeGoogleAdsKeyword(item.keyword);
    const current = map.get(key);
    if (!current || item.score > current.score || item.avgMonthlySearches > current.avgMonthlySearches) map.set(key, item);
  });
  return Array.from(map.values()).sort((a, b) => b.score - a.score || b.avgMonthlySearches - a.avgMonthlySearches);
}

function buildNegativeKeywords(decisions: AdsPlannerKeywordDecision[]) {
  const negatives = new Map<string, AdsPlannerNegativeKeyword>();
  NEGATIVE_TERMS.forEach((term) => negatives.set(term, { keyword: term, reason: 'Từ khóa lọc cơ bản để tránh traffic không mua hàng.', source: 'Rule ngân sách nhỏ' }));
  decisions.filter((item) => item.decision === 'do-not-run' && isNegativeKeyword(item.keyword)).forEach((item) => {
    negatives.set(item.keyword, { keyword: item.keyword, reason: item.reason || 'Không phù hợp để chạy Ads.', source: item.source });
  });
  return Array.from(negatives.values()).slice(0, 80);
}

function cleanAdText(value: string, max: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : text.slice(0, max - 1).trim();
}

function uniqueAdTexts(items: string[], max: number) {
  return Array.from(new Set(items.map((item) => cleanAdText(item, max)).filter(Boolean)));
}

function adHeadlines(groupName: string) {
  const normalized = normalizeGoogleAdsKeyword(groupName);
  let base: string[];
  if (normalized.includes('ghe chan quy')) {
    base = ['Ghế Chân Quỳ Văn Phòng', 'Ghế Phòng Họp Hà Nội', 'Báo Giá Ghế Chân Quỳ', 'Ghế Chờ Cho Văn Phòng', 'Tư Vấn Ghế Chân Quỳ', 'Nhiều Mẫu Ghế Chân Quỳ', 'Ghế Lưng Lưới Dễ Ngồi', 'Xem Mẫu Ghế Văn Phòng', 'Giao Hàng Tại Hà Nội', 'Liên Hệ Nhận Báo Giá'];
  } else if (normalized.includes('ghe giam doc')) {
    base = ['Ghế Giám Đốc Hà Nội', 'Báo Giá Ghế Giám Đốc', 'Ghế Lãnh Đạo Sang Trọng', 'Tư Vấn Chọn Ghế', 'Ghế Da Cho Giám Đốc', 'Ghế Làm Việc Cao Cấp', 'Xem Mẫu Ghế Lãnh Đạo', 'Giao Ghế Tại Hà Nội', 'Nội Thất Hùng Ngọc', 'Liên Hệ Nhận Báo Giá'];
  } else if (normalized.includes('ghe xoay')) {
    base = ['Ghế Xoay Văn Phòng', 'Ghế Làm Việc Hà Nội', 'Báo Giá Ghế Xoay', 'Ghế Lưng Lưới Dễ Ngồi', 'Ghế Đệm Cho Nhân Viên', 'Tư Vấn Chọn Ghế Xoay', 'Xem Mẫu Ghế Làm Việc', 'Ghế Xoay Theo Nhu Cầu', 'Giao Hàng Tại Hà Nội', 'Liên Hệ Nhận Báo Giá'];
  } else if (normalized.includes('giuong tang')) {
    base = ['Giường Tầng Sắt Hà Nội', 'Báo Giá Giường Tầng', 'Giường Tầng Nhà Trọ', 'Giường Ký Túc Xá', 'Giường Sắt 2 Tầng', 'Tư Vấn Kích Thước', 'Giường Tầng Gia Đình', 'Xem Mẫu Giường Sắt', 'Giao Hàng Tại Hà Nội', 'Liên Hệ Nhận Báo Giá'];
  } else {
    base = [groupName + ' Hà Nội', 'Báo Giá ' + groupName, 'Tư Vấn Chọn Sản Phẩm', 'Nội Thất Hùng Ngọc', 'Xem Mẫu Phù Hợp', 'Liên Hệ Nhận Báo Giá', 'Giao Hàng Tại Hà Nội', 'Sản Phẩm Cho Văn Phòng', 'Hỗ Trợ Chọn Kích Thước', 'Báo Giá Nhanh Trong Ngày'];
  }
  return uniqueAdTexts(base, 30).slice(0, 10);
}

function adDescriptions(groupName: string) {
  const normalized = normalizeGoogleAdsKeyword(groupName);
  let base: string[];
  if (normalized.includes('ghe chan quy')) {
    base = ['Ghế chân quỳ cho phòng họp, phòng chờ và văn phòng. Liên hệ báo giá Hà Nội.', 'Tư vấn chọn ghế chân quỳ theo nhu cầu, kích thước và số lượng.', 'Xem mẫu ghế chân quỳ lưng lưới, đệm ngồi phù hợp văn phòng.', 'Nội Thất Hùng Ngọc hỗ trợ báo giá ghế chân quỳ tại Hà Nội.'];
  } else if (normalized.includes('ghe giam doc')) {
    base = ['Ghế giám đốc nhiều kiểu dáng, chất liệu. Tư vấn mẫu phù hợp phòng làm việc.', 'Liên hệ nhận báo giá ghế giám đốc và gợi ý mẫu giao tại Hà Nội.', 'Xem mẫu ghế lãnh đạo, ghế da, ghế làm việc theo nhu cầu sử dụng.', 'Nội Thất Hùng Ngọc hỗ trợ tư vấn ghế giám đốc cho văn phòng.'];
  } else if (normalized.includes('ghe xoay')) {
    base = ['Ghế xoay làm việc, lưng lưới hoặc đệm ngồi. Tư vấn chọn theo nhu cầu.', 'Xem mẫu ghế xoay văn phòng phù hợp nhân viên, phòng làm việc và học tập.', 'Liên hệ nhận báo giá ghế xoay tại Hà Nội theo số lượng cần mua.', 'Nội Thất Hùng Ngọc hỗ trợ chọn ghế xoay dễ ngồi, đúng nhu cầu.'];
  } else if (normalized.includes('giuong tang')) {
    base = ['Giường tầng sắt cho nhà trọ, ký túc xá và gia đình. Liên hệ báo giá Hà Nội.', 'Tư vấn kích thước giường tầng sắt theo phòng, số lượng và nhu cầu sử dụng.', 'Xem mẫu giường sắt 2 tầng phù hợp nhà trọ, ký túc xá, gia đình.', 'Nội Thất Hùng Ngọc hỗ trợ báo giá giường tầng sắt tại Hà Nội.'];
  } else {
    base = ['Liên hệ Nội Thất Hùng Ngọc để được tư vấn mẫu phù hợp và nhận báo giá.', 'Xem sản phẩm, chọn kích thước và gửi yêu cầu báo giá theo nhu cầu.', 'Hỗ trợ tư vấn sản phẩm nội thất tại Hà Nội cho gia đình và văn phòng.', 'Báo giá rõ ràng theo mẫu, kích thước, chất liệu và số lượng cần mua.'];
  }
  return uniqueAdTexts(base, 90).slice(0, 4);
}

function buildAdGroups(items: AdsPlannerKeywordDecision[], negativeKeywords: AdsPlannerNegativeKeyword[]) {
  const groups = new Map<string, AdsPlannerKeywordDecision[]>();
  items.filter((item) => item.finalUrl && (item.decision === 'run-now' || item.decision === 'test-small-budget')).forEach((item) => {
    const key = item.campaignName + '|' + item.adGroupName + '|' + item.finalUrl;
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return Array.from(groups.entries()).map(([key, rows], index): AdsPlannerAdGroup => {
    const [campaignName, adGroupName, finalUrl] = key.split('|');
    const sorted = rows
      .filter((item) => item.finalUrl === finalUrl && item.adGroupName === adGroupName)
      .sort((a, b) => b.score - a.score || b.avgMonthlySearches - a.avgMonthlySearches);
    const groupKey = adGroupId(campaignName, adGroupName, finalUrl);
    const warnings = Array.from(new Set(sorted.flatMap((item) => item.risk ? item.risk.split(/(?<=\.)\s+/).filter(Boolean) : []))).slice(0, 4);
    const exactKeywords = dedupeMatchKeywords(sorted.slice(0, 20).map((item) => '[' + item.keyword + ']'), groupKey);
    const phraseKeywords = dedupeMatchKeywords(sorted.slice(0, 20).map((item) => '"' + item.keyword + '"'), groupKey);
    const budgetStatus: AdsPlannerAdGroup['budgetStatus'] = index === 0 ? 'Bật ưu tiên' : index === 1 ? 'Bật test' : 'Chưa bật - chờ dữ liệu';
    const dailyBudgetAmount = index === 0 ? MAIN_GROUP_BUDGET : index === 1 ? TEST_GROUP_BUDGET : 0;
    const dailyBudgetHint = index === 0 ? '70.000đ - 90.000đ/ngày' : index === 1 ? '30.000đ - 50.000đ/ngày' : 'Chưa bật - chờ dữ liệu';
    return {
      id: groupKey || 'ad-group-' + index + '-' + normalizeText(adGroupName).replace(/\s+/g, '-'),
      campaignName,
      adGroupName,
      finalUrl,
      landingPageTitle: sorted[0]?.landingPageTitle || adGroupName,
      keywordCount: sorted.length,
      exactKeywords,
      phraseKeywords,
      negativeKeywords: Array.from(new Set(negativeKeywords.slice(0, 25).map((item) => item.keyword))),
      reason: 'Nhóm keyword cùng intent, cùng landing page chính và chỉ dùng exact/phrase để kiểm soát ngân sách.',
      warnings,
      headlines: adHeadlines(adGroupName),
      descriptions: adDescriptions(adGroupName),
      urlStatus: sorted.some((item) => item.urlStatus === 'Đã xác nhận URL') ? 'Đã xác nhận URL' : sorted.some((item) => item.urlStatus === 'Chờ xác nhận URL') ? 'Chờ xác nhận URL' : 'Chưa có URL',
      budgetStatus,
      dailyBudgetHint,
      dailyBudgetAmount,
    };
  }).filter((group) => group.exactKeywords.length || group.phraseKeywords.length).sort((a, b) => b.keywordCount - a.keywordCount).slice(0, 10);
}

function buildLandingWarnings(decisions: AdsPlannerKeywordDecision[]) {
  const warnings = new Map<string, AdsPlannerLandingWarning>();
  decisions.forEach((item) => {
    if (!item.finalUrl) {
      const key = 'missing-url|' + normalizeGoogleAdsKeyword(item.keyword);
      warnings.set(key, {
        url: 'Chưa có URL',
        title: item.keyword,
        warning: 'Keyword có volume nhưng chưa map được landing page, không nên chạy Ads ngay.',
        source: item.source,
      });
      return;
    }
    if (item.risk) {
      item.risk.split(/(?<=\.)\s+/).filter(Boolean).forEach((warning) => {
        const warningType = normalizeGoogleAdsKeyword(warning).slice(0, 60);
        const key = cleanPath(item.finalUrl) + '|' + warningType;
        if (!warnings.has(key)) warnings.set(key, {
          url: item.finalUrl,
          title: item.landingPageTitle || item.adGroupName,
          warning,
          source: item.source,
        });
      });
    }
  });
  return Array.from(warnings.values()).slice(0, 20);
}

function copyCampaignStructure(adGroups: AdsPlannerAdGroup[]) {
  return adGroups.map((group) => [
    'Campaign: ' + group.campaignName,
    'Ad group: ' + group.adGroupName,
    'Final URL: ' + group.finalUrl,
    'URL status: ' + group.urlStatus,
    'Budget: ' + group.dailyBudgetHint + ' (' + group.budgetStatus + ')',
    'Exact:',
    ...group.exactKeywords,
    'Phrase:',
    ...group.phraseKeywords,
    'Negative: ' + group.negativeKeywords.join(', '),
  ].join('\n')).join('\n\n');
}

function copyAdText(adGroups: AdsPlannerAdGroup[]) {
  return adGroups.map((group) => [
    group.adGroupName + ' -> ' + group.finalUrl,
    'Headlines:',
    ...group.headlines.map((item) => '- ' + item),
    'Descriptions:',
    ...group.descriptions.map((item) => '- ' + item),
  ].join('\n')).join('\n\n');
}


function buildActionPlanToday(adGroups: AdsPlannerAdGroup[], negativeKeywords: AdsPlannerNegativeKeyword[], landingWarnings: AdsPlannerLandingWarning[]): AdsPlannerActionTask[] {
  const tasks: AdsPlannerActionTask[] = [];
  const primaryGroups = adGroups.filter((group) => group.dailyBudgetAmount > 0).slice(0, 2);
  primaryGroups.forEach((group, index) => {
    tasks.push({
      id: 'ads-action-campaign-' + index,
      title: 'Tạo chiến dịch Search cho ' + group.adGroupName,
      reason: group.reason + ' Chạy exact/phrase để kiểm soát ngân sách, không dùng broad match.',
      keywords: [...group.exactKeywords, ...group.phraseKeywords].slice(0, 10),
      finalUrl: group.finalUrl,
      priority: index === 0 ? 'Cao' : 'Trung bình',
      estimatedTime: '20 phút',
      copyTask: [
        'Tạo campaign: ' + group.campaignName,
        'Ad group: ' + group.adGroupName,
        'Final URL: ' + group.finalUrl,
        'Match type: exact + phrase, không dùng broad match',
        'Keyword:',
        ...group.exactKeywords.slice(0, 8),
        ...group.phraseKeywords.slice(0, 8),
      ].join('\n'),
    });
  });
  tasks.push({
    id: 'ads-action-negative',
    title: 'Thêm negative keywords trước khi bật chiến dịch',
    reason: 'Chặn nhóm tìm kiếm rác như cũ, thanh lý, miễn phí, file, tuyển dụng trước khi tiêu ngân sách.',
    keywords: negativeKeywords.slice(0, 25).map((item) => item.keyword),
    finalUrl: '',
    priority: 'Cao',
    estimatedTime: '10 phút',
    copyTask: negativeKeywords.slice(0, 40).map((item) => item.keyword).join('\n'),
  });
  if (landingWarnings.length) {
    tasks.push({
      id: 'ads-action-landing-check',
      title: 'Kiểm tra landing page trước khi tăng ngân sách',
      reason: 'Có URL/keyword cần tối ưu để tránh click tốn tiền nhưng khó chuyển đổi.',
      keywords: landingWarnings.slice(0, 8).map((item) => item.title),
      finalUrl: landingWarnings[0]?.url || '',
      priority: 'Cao',
      estimatedTime: '30 phút',
      copyTask: landingWarnings.slice(0, 10).map((item) => item.url + ' - ' + item.warning).join('\n'),
    });
  }
  tasks.push({
    id: 'ads-action-after-24h',
    title: 'Theo dõi Search terms sau 24 giờ',
    reason: 'Sau khi có click thật, cần lọc search terms, tắt keyword tốn click không có gọi/Zalo và bổ sung negative keywords.',
    keywords: [],
    finalUrl: '',
    priority: 'Trung bình',
    estimatedTime: '15 phút/ngày',
    copyTask: 'Sau 24h: mở Search terms, thêm negative keyword, tắt keyword nhiều click không có cuộc gọi/Zalo, giữ exact/phrase có tín hiệu tốt.',
  });
  return tasks.slice(0, 10);
}

function buildCampaignPlan(adGroups: AdsPlannerAdGroup[]): AdsPlannerCampaignPlan[] {
  const map = new Map<string, AdsPlannerAdGroup[]>();
  adGroups.forEach((group) => map.set(group.campaignName, [...(map.get(group.campaignName) || []), group]));
  return Array.from(map.entries()).map(([campaignName, groups]) => ({
    campaignName,
    reason: 'Gom các ad group cùng ngành hàng để dễ kiểm soát ngân sách, search terms và landing page.',
    budgetHint: groups.length > 1 ? 'Nếu ngân sách thấp, chỉ bật 1-2 ad group tốt nhất trước.' : 'Có thể test 30.000đ - 100.000đ/ngày tùy mức ưu tiên.',
    adGroups: groups.slice(0, 6).map((group) => ({
      adGroupName: group.adGroupName,
      finalUrl: group.finalUrl,
      keywordCount: group.keywordCount,
      exactKeywords: group.exactKeywords.slice(0, 15),
      phraseKeywords: group.phraseKeywords.slice(0, 15),
      negativeKeywords: group.negativeKeywords.slice(0, 20),
      riskWarnings: group.warnings,
      urlStatus: group.urlStatus,
      budgetStatus: group.budgetStatus,
      dailyBudgetHint: group.dailyBudgetHint,
    })),
  })).slice(0, 8);
}

function buildBudgetSuggestion(adGroups: AdsPlannerAdGroup[]): AdsPlannerBudgetSuggestion {
  const groupBudgets = adGroups.slice(0, 8).map((group) => ({
    campaignName: group.campaignName,
    adGroupName: group.adGroupName,
    finalUrl: group.finalUrl,
    dailyBudgetHint: group.dailyBudgetHint,
    dailyBudgetAmount: group.dailyBudgetAmount,
    budgetStatus: group.budgetStatus,
    reason: group.dailyBudgetAmount > 0 ? 'Nhóm được bật trong giai đoạn đầu, tổng ngân sách vẫn nằm trong 120.000đ/ngày.' : 'Chưa bật để tránh chia mỏng ngân sách, chờ dữ liệu search terms từ 1-2 nhóm đầu.',
  }));
  const activeTotal = groupBudgets.reduce((sum, item) => sum + item.dailyBudgetAmount, 0);
  return {
    totalDailyBudgetHint: 'Tổng đề xuất giai đoạn đầu: ' + activeTotal.toLocaleString('vi-VN') + 'đ/ngày trên ngân sách ' + INITIAL_TOTAL_DAILY_BUDGET.toLocaleString('vi-VN') + 'đ/ngày.',
    highPriorityBudget: 'Nhóm ưu tiên chính: 70.000đ - 90.000đ/ngày.',
    testBudget: 'Nhóm test: 30.000đ - 50.000đ/ngày.',
    recommendation: 'Chỉ bật tối đa 2 ad group trong giai đoạn đầu. Các nhóm còn lại để Chưa bật - chờ dữ liệu.',
    groupBudgets,
  };
}

function buildMatchTypeKeywords(adGroups: AdsPlannerAdGroup[]): AdsPlannerMatchTypeKeywordBlock[] {
  return adGroups.slice(0, 10).map((group) => ({
    adGroupName: group.adGroupName,
    finalUrl: group.finalUrl,
    exactKeywords: group.exactKeywords.slice(0, 20),
    phraseKeywords: group.phraseKeywords.slice(0, 20),
    copyText: [...group.exactKeywords.slice(0, 20), ...group.phraseKeywords.slice(0, 20)].join('\n'),
    urlStatus: group.urlStatus,
    dailyBudgetHint: group.dailyBudgetHint,
  }));
}

function buildAdCopies(adGroups: AdsPlannerAdGroup[]): AdsPlannerAdCopyBlock[] {
  return adGroups.slice(0, 10).map((group) => ({
    adGroupName: group.adGroupName,
    finalUrl: group.finalUrl,
    headlines: group.headlines.slice(0, 10),
    descriptions: group.descriptions.slice(0, 4),
    copyText: ['Ad group: ' + group.adGroupName, 'Final URL: ' + group.finalUrl, 'Headlines:', ...group.headlines.slice(0, 10), 'Descriptions:', ...group.descriptions.slice(0, 4)].join('\n'),
    headlineLengths: group.headlines.slice(0, 10).map((item) => item.length),
    descriptionLengths: group.descriptions.slice(0, 4).map((item) => item.length),
    warnings: [
      ...group.headlines.filter((item) => item.length > 30).map((item) => 'Headline vượt 30 ký tự: ' + item),
      ...group.descriptions.filter((item) => item.length > 90).map((item) => 'Description vượt 90 ký tự: ' + item),
    ],
  }));
}

function buildFollowUpChecklist(): string[] {
  return [
    'Sau 24 giờ: kiểm tra Search terms và thêm negative keywords mới.',
    'Tắt keyword nếu có nhiều click nhưng không có cuộc gọi, Zalo hoặc đơn hỏi giá.',
    'Không mở broad match cho tới khi có dữ liệu chuyển đổi ổn định.',
    'So sánh GSC: position 1-5 chỉ chạy bảo vệ/đối thủ nếu cần; position 11-30 có thể vừa SEO vừa Ads test.',
    'Nếu CTR Ads thấp, sửa headline/description trước khi tăng ngân sách.',
    'Nếu landing page thiếu sản phẩm thật, số điện thoại/Zalo hoặc nội dung giá trị, tối ưu trước khi chạy mạnh.',
  ];
}

function copyActionPlan(tasks: AdsPlannerActionTask[]) {
  return tasks.map((task, index) => [String(index + 1) + '. ' + task.title, 'Ưu tiên: ' + task.priority, 'Thời gian: ' + task.estimatedTime, 'URL: ' + (task.finalUrl || '-'), 'Lý do: ' + task.reason, 'Keyword: ' + (task.keywords.join(', ') || '-'), 'Việc cần copy:', task.copyTask].join('\n')).join('\n\n');
}

function copyMatchTypeKeywords(blocks: AdsPlannerMatchTypeKeywordBlock[]) {
  return blocks.map((block) => [block.adGroupName + ' -> ' + block.finalUrl, ...block.exactKeywords, ...block.phraseKeywords].join('\n')).join('\n\n');
}

function textOrUnknown(value: unknown) {
  const text = String(value || '').trim();
  return text || 'Chưa có dữ liệu';
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function asAccountStatus(value: unknown): AdsAccountStatus {
  const text = String(value || '').trim();
  return ADS_ACCOUNT_STATUS_OPTIONS.includes(text as AdsAccountStatus) ? text as AdsAccountStatus : 'Không xác định';
}

export function buildDefaultAdsAccountHistory(now = new Date().toISOString()): AdsAccountHistory {
  return {
    previousRunStartDate: null,
    previousRunEndDate: null,
    daysRun: 7,
    dailyBudget: 200000,
    estimatedSpend: 1400000,
    actualSpend: null,
    impressions: null,
    clicks: null,
    ctr: null,
    averageCpc: null,
    conversions: 0,
    conversionValue: null,
    phoneCalls: null,
    zaloContacts: null,
    formSubmissions: null,
    orders: null,
    warningMessage: 'Chưa có dữ liệu',
    warningDate: null,
    accountStatus: 'Không xác định',
    billingStatus: 'Chưa có dữ liệu',
    advertiserVerificationStatus: 'Chưa có dữ liệu',
    policyStatus: 'Chưa có dữ liệu',
    campaignStatus: 'Chỉ lập kế hoạch - chưa chạy',
    conversionTrackingStatus: 'Chưa xác nhận',
    evidenceSource: 'Bối cảnh nhập tay: từng chạy khoảng 7 ngày, ngân sách khoảng 200.000đ/ngày, Google Ads ghi nhận 0 chuyển đổi, sau đó có cảnh báo và ngừng tiêu tiền/phân phối.',
    notes: 'Chưa đủ dữ liệu để kết luận tài khoản bị đình chỉ. Không coi ngừng tiêu tiền là bằng chứng đình chỉ.',
    updatedAt: now,
  };
}

export function normalizeAdsAccountHistory(value: unknown, now = new Date().toISOString()): AdsAccountHistory {
  const fallback = buildDefaultAdsAccountHistory(now);
  const record = normalizePlannerPayload(value);
  const row = record && typeof record === 'object' && !Array.isArray(record) ? record as Record<string, unknown> : {};
  return {
    previousRunStartDate: String(row.previousRunStartDate || '') || fallback.previousRunStartDate,
    previousRunEndDate: String(row.previousRunEndDate || '') || fallback.previousRunEndDate,
    daysRun: nullableNumber(row.daysRun) ?? fallback.daysRun,
    dailyBudget: nullableNumber(row.dailyBudget) ?? fallback.dailyBudget,
    estimatedSpend: nullableNumber(row.estimatedSpend) ?? fallback.estimatedSpend,
    actualSpend: nullableNumber(row.actualSpend),
    impressions: nullableNumber(row.impressions),
    clicks: nullableNumber(row.clicks),
    ctr: nullableNumber(row.ctr),
    averageCpc: nullableNumber(row.averageCpc),
    conversions: nullableNumber(row.conversions) ?? fallback.conversions,
    conversionValue: nullableNumber(row.conversionValue),
    phoneCalls: nullableNumber(row.phoneCalls),
    zaloContacts: nullableNumber(row.zaloContacts),
    formSubmissions: nullableNumber(row.formSubmissions),
    orders: nullableNumber(row.orders),
    warningMessage: textOrUnknown(row.warningMessage),
    warningDate: String(row.warningDate || '') || null,
    accountStatus: asAccountStatus(row.accountStatus),
    billingStatus: textOrUnknown(row.billingStatus),
    advertiserVerificationStatus: textOrUnknown(row.advertiserVerificationStatus),
    policyStatus: textOrUnknown(row.policyStatus),
    campaignStatus: textOrUnknown(row.campaignStatus),
    conversionTrackingStatus: textOrUnknown(row.conversionTrackingStatus),
    evidenceSource: textOrUnknown(row.evidenceSource),
    notes: textOrUnknown(row.notes),
    updatedAt: String(row.updatedAt || now),
  };
}

function hasKnownIssue(value: string, terms: string[]) {
  const normalized = normalizeGoogleAdsKeyword(value);
  return terms.some((term) => normalized.includes(normalizeGoogleAdsKeyword(term)));
}

function diagnosticStatus(condition: boolean, unknown = false): AdsDiagnosticItem['status'] {
  if (condition) return 'blocked';
  return unknown ? 'unknown' : 'warning';
}

function diagnosticStatusFromRule(rule: AdsRuleEvaluation | undefined): AdsDiagnosticItem['status'] {
  if (!rule) return 'unknown';
  if (rule.status === 'block' || rule.status === 'fail') return 'blocked';
  if (rule.status === 'pass') return 'ok';
  if (rule.status === 'not_applicable') return 'unknown';
  if (rule.status === 'unknown') return 'unknown';
  return 'warning';
}

function ruleById(ruleEvaluations: AdsRuleEvaluation[], id: string) {
  return ruleEvaluations.find((rule) => rule.id === id);
}

function buildAccountPolicyDiagnostics(history: AdsAccountHistory, ruleEvaluations: AdsRuleEvaluation[]): AdsDiagnosticItem[] {
  const evidence = 'Trạng thái nhập tay: ' + history.accountStatus + '. Cảnh báo: ' + history.warningMessage + '. Nguồn: ' + history.evidenceSource;
  const billingIssue = history.accountStatus === 'Lỗi thanh toán' || hasKnownIssue(history.billingStatus, ['loi', 'tu choi', 'no', 'payment', 'billing']);
  const verificationIssue = history.accountStatus === 'Chờ xác minh nhà quảng cáo' || hasKnownIssue(history.advertiserVerificationStatus, ['cho xac minh', 'can xac minh', 'verification']);
  const policyIssue = history.accountStatus === 'Bị giới hạn bởi chính sách' || history.accountStatus === 'Quảng cáo bị từ chối' || hasKnownIssue(history.policyStatus + ' ' + history.warningMessage, ['policy', 'chinh sach', 'tu choi', 'gioi han']);
  const suspended = history.accountStatus === 'Tài khoản bị đình chỉ' || history.accountStatus === 'Tài khoản bị hủy';
  const campaignPaused = history.accountStatus === 'Chiến dịch tạm dừng' || hasKnownIssue(history.campaignStatus, ['tam dung', 'paused']);
  const unknown = history.accountStatus === 'Không xác định';
  const accountRule = ruleById(ruleEvaluations, 'official-account-status');
  const billingRule = ruleById(ruleEvaluations, billingIssue ? 'platform-billing' : 'official-advertiser-verification') || ruleById(ruleEvaluations, 'platform-billing');
  const policyRule = ruleById(ruleEvaluations, 'official-policy-warning');
  const campaignRule = ruleById(ruleEvaluations, 'platform-campaign-settings');
  return [
    {
      id: 'account-status',
      title: 'Account suspended/cancelled/paused',
      ruleId: accountRule?.id || 'official-account-status',
      ruleSource: accountRule?.source || 'OFFICIAL_POLICY',
      status: diagnosticStatusFromRule(accountRule) || (suspended ? 'blocked' : campaignPaused ? 'warning' : unknown ? 'unknown' : 'ok'),
      evidence: accountRule?.evidence || evidence,
      confidence: accountRule?.confidence || (suspended || campaignPaused ? 'Trung bình' : unknown ? 'Chưa đủ dữ liệu' : 'Thấp'),
      missingData: accountRule?.missingData.length ? accountRule.missingData : ['Ảnh chụp trang Billing/Policy manager', 'Email hoặc thông báo chính thức từ Google Ads'],
      recommendedCheck: accountRule?.recommendedCheck || 'Google Ads > Tools > Billing, Policy manager, Account status.',
      allowedAction: accountRule?.allowedAction || 'Đối chiếu thông báo chính thức, ghi nguyên văn cảnh báo và xử lý đúng lý do Google nêu.',
      forbiddenAction: accountRule?.forbiddenAction || 'Không tự kết luận đình chỉ, không tạo tài khoản mới để né đình chỉ, không lách xét duyệt.',
    },
    {
      id: 'billing-verification',
      title: 'Billing/payment issue hoặc advertiser verification',
      ruleId: billingRule?.id || 'platform-billing',
      ruleSource: billingRule?.source || 'PLATFORM_RULE',
      status: diagnosticStatusFromRule(billingRule) || diagnosticStatus(billingIssue || verificationIssue, !billingIssue && !verificationIssue),
      evidence: billingRule?.evidence || ('Billing: ' + history.billingStatus + '. Xác minh: ' + history.advertiserVerificationStatus + '.'),
      confidence: billingRule?.confidence || (billingIssue || verificationIssue ? 'Trung bình' : 'Chưa đủ dữ liệu'),
      missingData: billingRule?.missingData.length ? billingRule.missingData : ['Tình trạng phương thức thanh toán', 'Khoản nợ nếu có', 'Trạng thái xác minh nhà quảng cáo'],
      recommendedCheck: billingRule?.recommendedCheck || 'Google Ads > Billing > Summary/Payment methods và Tools > Advertiser verification.',
      allowedAction: billingRule?.allowedAction || 'Cập nhật phương thức thanh toán hợp lệ hoặc hoàn tất xác minh theo hướng dẫn trong tài khoản.',
      forbiddenAction: billingRule?.forbiddenAction || 'Không lưu thông tin thẻ, OTP, token hoặc mật khẩu trong dashboard.',
    },
    {
      id: 'policy-ad',
      title: 'Ad disapproved / limited by policy',
      ruleId: policyRule?.id || 'official-policy-warning',
      ruleSource: policyRule?.source || 'OFFICIAL_POLICY',
      status: diagnosticStatusFromRule(policyRule) || diagnosticStatus(policyIssue, !policyIssue),
      evidence: policyRule?.evidence || ('Policy status: ' + history.policyStatus + '. Warning: ' + history.warningMessage + '.'),
      confidence: policyRule?.confidence || (policyIssue ? 'Trung bình' : 'Chưa đủ dữ liệu'),
      missingData: policyRule?.missingData.length ? policyRule.missingData : ['Nguyên văn lý do từ chối', 'Mẫu quảng cáo bị ảnh hưởng', 'Final URL liên quan'],
      recommendedCheck: policyRule?.recommendedCheck || 'Google Ads > Ads > Policy details hoặc Policy manager.',
      allowedAction: policyRule?.allowedAction || 'Sửa nội dung/landing page theo đúng lý do từ chối và chỉ appeal khi đã có bằng chứng khắc phục.',
      forbiddenAction: policyRule?.forbiddenAction || 'Không tự gửi appeal, không khẳng định đã khắc phục khi chưa có bằng chứng.',
    },
    {
      id: 'campaign-delivery',
      title: 'Campaign settings làm ngừng phân phối',
      ruleId: campaignRule?.id || 'platform-campaign-settings',
      ruleSource: campaignRule?.source || 'PLATFORM_RULE',
      status: diagnosticStatusFromRule(campaignRule) || (campaignPaused ? 'warning' : 'unknown'),
      evidence: (campaignRule?.evidence || 'Campaign status: ' + history.campaignStatus + '.') + ' Ngừng tiêu tiền/phân phối chưa đồng nghĩa tài khoản bị đình chỉ.',
      confidence: campaignRule?.confidence || (campaignPaused ? 'Trung bình' : 'Chưa đủ dữ liệu'),
      missingData: campaignRule?.missingData.length ? campaignRule.missingData : ['Start/end date', 'Ad schedule', 'Location targeting', 'Bid/budget', 'Keyword eligibility'],
      recommendedCheck: campaignRule?.recommendedCheck || 'Google Ads > Campaigns > Settings, Ad schedule, Locations, Keywords status.',
      allowedAction: campaignRule?.allowedAction || 'Kiểm tra ngày chạy, lịch, vị trí Hà Nội/khu giao hàng thật, bid, search volume và landing page.',
      forbiddenAction: campaignRule?.forbiddenAction || 'Không tăng ngân sách để sửa lỗi tracking, chính sách hoặc landing page.',
    },
  ];
}

function buildConversionDiagnostics(history: AdsAccountHistory, ruleEvaluations: AdsRuleEvaluation[]): AdsDiagnosticItem[] {
  const trackingUnconfirmed = !hasKnownIssue(history.conversionTrackingStatus, ['xac nhan', 'dang hoat dong', 'verified']) || hasKnownIssue(history.conversionTrackingStatus, ['chua', 'sai', 'loi']);
  const zeroAdsConversions = history.conversions === 0;
  const trackingRule = ruleById(ruleEvaluations, 'platform-conversion-tracking');
  const goalRule = ruleById(ruleEvaluations, 'business-primary-goal');
  const baseEvidence = zeroAdsConversions
    ? 'Google Ads ghi nhận 0 chuyển đổi; chưa đủ bằng chứng xác nhận không có cuộc gọi, Zalo, biểu mẫu hoặc đơn hàng thực tế.'
    : 'Conversions đã nhập: ' + String(history.conversions ?? 'Chưa có dữ liệu') + '.';
  return [
    {
      id: 'conversion-tracking-status',
      title: 'Google tag / GTM / conversion action',
      ruleId: trackingRule?.id || 'platform-conversion-tracking',
      ruleSource: trackingRule?.source || 'PLATFORM_RULE',
      status: diagnosticStatusFromRule(trackingRule) || (trackingUnconfirmed ? 'blocked' : 'ok'),
      evidence: baseEvidence + ' ' + (trackingRule?.evidence || ('Tracking status: ' + history.conversionTrackingStatus + '.')),
      confidence: trackingRule?.confidence || (trackingUnconfirmed ? 'Cao' : 'Trung bình'),
      missingData: trackingRule?.missingData.length ? trackingRule.missingData : ['Google tag hoặc GTM container', 'Conversion action Primary/Secondary', 'Include in Conversions', 'Count One/Every', 'Attribution'],
      recommendedCheck: trackingRule?.recommendedCheck || 'Google Ads > Goals > Conversions và Tools > Google tag / Tag diagnostics.',
      allowedAction: trackingRule?.allowedAction || 'Xác nhận tag, event, thank-you/success event, phone click, Zalo click, form submit và order completed.',
      forbiddenAction: trackingRule?.forbiddenAction || 'Không kết luận thực tế không có chuyển đổi khi tracking chưa xác nhận.',
    },
    {
      id: 'real-lead-match',
      title: 'Đối chiếu lead thật với Ads conversions',
      ruleId: goalRule?.id || 'business-primary-goal',
      ruleSource: goalRule?.source || 'BUSINESS_GUARDRAIL',
      status: diagnosticStatusFromRule(goalRule) || 'warning',
      evidence: baseEvidence + ' ' + (goalRule?.evidence || ('Phone: ' + String(history.phoneCalls ?? 'Chưa có dữ liệu') + ', Zalo: ' + String(history.zaloContacts ?? 'Chưa có dữ liệu') + ', Form: ' + String(history.formSubmissions ?? 'Chưa có dữ liệu') + ', Orders: ' + String(history.orders ?? 'Chưa có dữ liệu') + '.')),
      confidence: goalRule?.confidence || 'Chưa đủ dữ liệu',
      missingData: goalRule?.missingData.length ? goalRule.missingData : ['Nhật ký cuộc gọi', 'Tin nhắn Zalo', 'Form submissions', 'Đơn hàng thực tế theo ngày chạy Ads'],
      recommendedCheck: goalRule?.recommendedCheck || 'So sánh log liên hệ thật trong 7 ngày chạy với báo cáo Conversions của Google Ads.',
      allowedAction: goalRule?.allowedAction || 'Phân biệt không có khách, có khách nhưng Ads không ghi nhận, tracking sai, hoặc event bị đếm trùng.',
      forbiddenAction: goalRule?.forbiddenAction || 'Không dùng page view làm chuyển đổi chính nếu đó không phải mục tiêu kinh doanh.',
    },
  ];
}

function buildFunnelDiagnostics(history: AdsAccountHistory): AdsFunnelDiagnostic[] {
  return [
    {
      id: 'no-impression',
      stage: 'Impression',
      possibleCause: 'Không có impression do tài khoản/campaign/keyword chưa đủ điều kiện, lịch chạy, vị trí, bid thấp hoặc policy.',
      evidence: history.impressions == null ? 'Impressions chưa có dữ liệu, không được bịa số.' : 'Impressions đã nhập: ' + history.impressions.toLocaleString('vi-VN') + '.',
      confidence: history.impressions == null ? 'Chưa đủ dữ liệu' : history.impressions === 0 ? 'Trung bình' : 'Thấp',
      missingData: ['Impressions theo campaign/ad group/keyword', 'Keyword status', 'Policy status'],
      recommendedCheck: 'Google Ads > Campaigns/Keywords > Status, Impr., Search lost IS nếu có.',
      priority: 'Cao',
    },
    {
      id: 'impression-low-click',
      stage: 'Click',
      possibleCause: 'Có impression nhưng ít click do intent sai, headline yếu, vị trí thấp hoặc search terms không đúng nhu cầu.',
      evidence: history.clicks == null || history.ctr == null ? 'Clicks/CTR chưa có dữ liệu.' : 'Clicks ' + history.clicks + ', CTR ' + history.ctr + '%.',
      confidence: 'Chưa đủ dữ liệu',
      missingData: ['Clicks', 'CTR', 'Search terms', 'Ad strength không dùng làm kết luận duy nhất'],
      recommendedCheck: 'Google Ads > Ads & assets và Search terms sau 24 giờ.',
      priority: 'Trung bình',
    },
    {
      id: 'click-no-contact',
      stage: 'Landing page -> Tương tác',
      possibleCause: 'Có click nhưng không liên hệ do landing page thiếu CTA, số điện thoại/Zalo khó thấy, final URL sai hoặc nội dung không khớp keyword.',
      evidence: 'Phone/Zalo/Form/Orders chưa đủ dữ liệu nhập tay.',
      confidence: 'Chưa đủ dữ liệu',
      missingData: ['Final URL đã xác nhận', 'Log cuộc gọi/Zalo/form', 'Ảnh landing page trên mobile'],
      recommendedCheck: 'Mở final URL trên mobile, kiểm tra CTA gọi/Zalo/form và tốc độ/trạng thái 404.',
      priority: 'Cao',
    },
    {
      id: 'contact-zero-ads-conversion',
      stage: 'Cuộc gọi/Zalo/Form',
      possibleCause: 'Có liên hệ thật nhưng Ads báo 0 conversion do tracking chưa cài, cài sai, action Secondary hoặc không include in Conversions.',
      evidence: history.conversions === 0 ? 'Google Ads ghi nhận 0 chuyển đổi; chưa đủ bằng chứng xác nhận không có liên hệ thật.' : 'Conversions chưa đủ dữ liệu.',
      confidence: 'Chưa đủ dữ liệu',
      missingData: ['Conversion action Primary/Secondary', 'Tag diagnostics', 'Log liên hệ thật'],
      recommendedCheck: 'Google Ads > Goals > Conversions, test bằng Tag Assistant nếu có quyền.',
      priority: 'Cao',
    },
    {
      id: 'wrong-search-terms',
      stage: 'Search terms',
      possibleCause: 'Nhiều click tốn tiền do search terms sai ý định hoặc match type quá rộng.',
      evidence: 'Chưa có báo cáo Search terms của 7 ngày chạy cũ.',
      confidence: 'Chưa đủ dữ liệu',
      missingData: ['Search terms', 'Cost/click/conversion theo search term', 'Negative keyword đã thêm'],
      recommendedCheck: 'Google Ads > Insights and reports > Search terms sau 24 giờ và 3 ngày.',
      priority: 'Trung bình',
    },
  ];
}

function buildGoogleAdsRuleEngineInput(params: {
  accountHistory: AdsAccountHistory;
  adGroups: AdsPlannerAdGroup[];
  landingWarnings: AdsPlannerLandingWarning[];
  googleAdsKeywordCount: number | null;
  searchConsoleRowsCount?: number;
  productsCount?: number;
  blogsCount?: number;
  clustersCount?: number;
  seoKeywordsCount?: number;
  workLogsCount?: number;
  keywordMapCount?: number;
}): GoogleAdsRuleEngineInput {
  return {
    accountHistory: params.accountHistory,
    adGroups: params.adGroups,
    landingWarnings: params.landingWarnings,
    googleAdsKeywordCount: params.googleAdsKeywordCount,
    searchConsoleRowsCount: params.searchConsoleRowsCount || 0,
    productsCount: params.productsCount || 0,
    blogsCount: params.blogsCount || 0,
    clustersCount: params.clustersCount || 0,
    seoKeywordsCount: params.seoKeywordsCount || 0,
    workLogsCount: params.workLogsCount || 0,
    keywordMapCount: params.keywordMapCount || 0,
    businessVertical: 'furniture',
    userDailyBudgetCap: params.accountHistory.dailyBudget,
  };
}

function buildReadinessScore(ruleEngineResult: GoogleAdsRuleEngineResult): AdsReadinessScore {
  const readiness = ruleEngineResult.readinessScore;
  return {
    total: readiness.total,
    classification: readiness.classification,
    canLaunch: readiness.canLaunch,
    launchMessage: readiness.launchMessage,
    categories: readiness.categories,
    hardBlockers: readiness.hardBlockers,
    missingData: readiness.missingData,
    ruleEvaluations: readiness.ruleEvaluations,
  };
}
function buildLaunchWizard(ruleEvaluations: AdsRuleEvaluation[]): AdsWizardStep[] {
  type WizardRow = [number, string, string, string, string, string, string, string, string[], string, string];
  const rows: Array<Omit<AdsWizardStep, 'status'>> = ([
    [0, 'Kiểm tra tài khoản', 'Account check', 'Xác nhận tài khoản đủ điều kiện phân phối.', 'Tools > Billing, Policy manager, Account status', 'Ghi nguyên văn cảnh báo, kiểm tra billing/xác minh/chính sách.', 'Không tạo tài khoản mới để né lỗi.', 'Không chạy khi còn blocker tài khoản.', ['Cảnh báo', 'Nguồn bằng chứng'], 'Cần đối chiếu thông báo chính thức.', 'Không còn blocker tài khoản/chính sách/thanh toán.'],
    [1, 'Xác định mục tiêu kinh doanh', 'Business goal', 'Chọn chuyển đổi chính cần tối ưu.', 'Goals > Conversions', 'Gọi điện/Zalo/form/đơn hàng thật.', 'Page view làm conversion chính.', 'AI cần mục tiêu rõ trước khi chọn bidding.', ['Mục tiêu chính', 'Giá trị lead/đơn nếu có'], 'Thiếu mục tiêu là hard blocker.', 'Mục tiêu chính đã được người dùng xác nhận.'],
    [2, 'Kiểm tra chuyển đổi', 'Conversion tracking', 'Xác minh tag và conversion action.', 'Goals > Conversions; Tools > Google tag', 'Primary, Include in Conversions, count phù hợp.', 'Maximize Conversions khi tracking chưa xác nhận.', 'Không đo đúng thì mọi tối ưu Ads sai hướng.', ['Tag ID/GTM', 'Tên conversion action'], 'Không lưu token/OTP/mật khẩu.', 'Tag diagnostics và test event có bằng chứng.'],
    [3, 'Kiểm tra landing page', 'Landing page', 'Đảm bảo final URL mở được và có CTA rõ.', 'Ads > Final URL; mở URL trên mobile', 'URL đúng sản phẩm, có gọi/Zalo/form rõ.', 'URL 404, sai sản phẩm, thông tin chưa xác nhận.', 'Click tốt vẫn lãng phí nếu trang không chuyển đổi.', ['Final URL', 'Ảnh kiểm tra mobile'], 'Không tự sửa slug.', 'URL đã xác nhận và không lỗi.'],
    [4, 'Chọn loại chiến dịch', 'Campaign type', 'Dùng Search campaign cho test kiểm soát.', 'New campaign > Search', 'Search Network.', 'Performance Max tự động hoặc Display trong test đầu.', 'Search giúp đọc intent và search terms rõ hơn.', ['Loại campaign'], 'Không tự bật PMax.', 'Campaign type đã chọn Search.'],
    [5, 'Chọn vị trí', 'Location targeting', 'Chỉ nhắm khu vực giao hàng thật.', 'Campaign settings > Locations', 'Hà Nội/khu giao hàng thật, presence in target location.', 'People interested in location nếu chưa hiểu.', 'Tránh click ngoài vùng phục vụ.', ['Khu vực giao hàng'], 'Sai vị trí làm tốn ngân sách.', 'Location targeting có ảnh/bằng chứng.'],
    [6, 'Cài lịch và thiết bị', 'Ad schedule/devices', 'Chạy khi có người nghe máy/trả lời Zalo.', 'Campaign settings > Ad schedule; Devices', 'Giờ có trực bán hàng.', 'Chạy 24/7 nếu không trực.', 'Lead nóng cần phản hồi nhanh.', ['Khung giờ trực', 'Thiết bị ưu tiên'], 'Không chỉnh nhiều thứ liên tục.', 'Lịch chạy đã khớp năng lực follow-up.'],
    [7, 'Chọn ngân sách và bidding', 'Budget and bidding', 'Đặt ngân sách nhỏ, không sửa lỗi bằng tăng tiền.', 'Campaign settings > Budget/Bidding', 'Maximize Clicks hoặc Manual CPC nếu còn hỗ trợ khi tracking chưa rõ.', 'Target CPA 10.000đ hoặc Maximize Conversions khi chưa có dữ liệu.', 'Bidding phải theo chất lượng tracking.', ['Ngân sách/ngày', 'Giới hạn CPC nếu có'], 'Không vượt ngân sách người dùng nhập.', 'Ngân sách không vượt giới hạn và bidding có lý do.'],
    [8, 'Tạo campaign', 'Campaign', 'Tạo 1 campaign test chính.', 'Campaigns > New campaign', 'Một campaign Search.', 'Nhiều campaign chia mỏng dữ liệu.', 'Tập trung dữ liệu và dễ kiểm soát.', ['Tên campaign'], 'Không áp dụng toàn bộ recommendation.', 'Campaign draft đã kiểm tra.'],
    [9, 'Tạo ad group', 'Ad group', 'Tạo 1 ad group chính, có thể 1 test.', 'Campaign > Ad groups', 'Nhóm keyword cùng intent/landing page.', 'Trộn nhiều intent khác nhau.', 'Ad relevance và landing page phải khớp.', ['Tên ad group', 'Final URL'], 'Không copy toàn bộ 4.427 keyword.', 'Ad group có keyword/URL đồng nhất.'],
    [10, 'Chọn keyword/match type', 'Keyword match type', 'Dùng exact và phrase trước.', 'Ad group > Keywords', 'Exact/phrase có intent mua rõ.', 'Broad match giai đoạn đầu.', 'Giữ kiểm soát search terms khi ngân sách nhỏ.', ['Keyword đã lọc', 'Match type'], 'Long-tail thiếu dữ liệu ghi Keyword test.', 'Keyword dedupe theo normalized keyword + match type + adGroupId.'],
    [11, 'Thêm negative keyword', 'Negative keywords', 'Chặn intent sai trước khi chạy.', 'Keywords > Negative keywords', 'Negative theo ngữ cảnh search term.', 'Thêm mù quáng làm chặn khách thật.', 'Negative đúng giúp tiết kiệm ngân sách.', ['Danh sách negative', 'Lý do'], 'Không tắt keyword chỉ vì một click.', 'Negative có lý do và phạm vi phù hợp.'],
    [12, 'Viết Responsive Search Ad', 'Responsive Search Ad', 'Viết nội dung khớp keyword/URL.', 'Ads > Responsive search ad', 'Headline <=30, description <=90, dữ liệu đã xác nhận.', 'Rẻ nhất/số 1/chính hãng/miễn phí/giảm giá khi chưa xác nhận.', 'Tránh claim sai và lỗi chính sách.', ['Headline', 'Description'], 'Không pin headline nếu không có lý do.', 'Mẫu quảng cáo đạt giới hạn ký tự.'],
    [13, 'Thêm assets', 'Assets', 'Bổ sung asset đã có dữ liệu thật.', 'Ads & assets > Assets', 'Sitelink/callout/call/location/image khi xác nhận.', 'Price/promotion nếu chưa có dữ liệu thật.', 'Assets tăng thông tin nhưng phải chính xác.', ['Số điện thoại', 'Địa chỉ', 'URL sitelink'], 'Chỉ lấy từ website/Supabase/config xác nhận.', 'Asset có nguồn bằng chứng.'],
    [14, 'Kiểm tra trước khi xuất bản', 'Pre-publish review', 'Rà blocker cuối cùng.', 'Campaign draft review', 'Checklist account, tracking, URL, budget, policy.', 'Xuất bản khi còn hard blocker.', 'Một lỗi nhỏ có thể làm ngừng phân phối.', ['Ảnh review'], 'AI không tự đánh dấu đã xác nhận.', 'Người dùng xác nhận bằng chứng.'],
    [15, 'Theo dõi sau khi chạy', 'Monitoring', 'Đọc tín hiệu sau 2-4h, 24h, 3 ngày, 7 ngày.', 'Reports, Search terms, Conversions', 'Theo dõi impression, status, search terms, lead thật.', 'Đổi nhiều cài đặt liên tục.', 'Cần đủ thời gian đọc tín hiệu.', ['Báo cáo theo mốc'], 'Không hứa có chuyển đổi.', 'Log theo dõi được nhập.'],
    [16, 'Giữ, sửa, giảm hoặc dừng', 'Keep, fix, reduce or pause', 'Ra quyết định dựa trên dữ liệu.', 'Campaign/ad group/keyword reports', 'Giữ phần có lead, sửa tracking/landing, giảm hoặc dừng phần lãng phí.', 'Tăng ngân sách để che lỗi.', 'Tối ưu theo phễu, không theo cảm tính.', ['Cost, leads, CPL/CPA, orders'], 'Không coi thiếu dữ liệu là đạt.', 'Có quyết định và lý do theo dữ liệu.'],
  ] as WizardRow[]).map(([index, vietnameseName, englishTerm, goal, googleAdsLocation, shouldChoose, shouldAvoid, reason, requiredInput, warning, completionCriteria]) => ({
    id: 'ads-wizard-' + index,
    index,
    vietnameseName,
    englishTerm,
    goal,
    googleAdsLocation,
    shouldChoose,
    shouldAvoid,
    reason,
    requiredInput,
    warning,
    completionCriteria,
  }));
  const categoryByStep: Record<number, AdsRuleEvaluation['readinessCategory']> = {
    0: 'account-policy',
    1: 'conversion-tracking',
    2: 'conversion-tracking',
    3: 'landing-page',
    5: 'campaign-settings',
    6: 'campaign-settings',
    7: 'campaign-settings',
    10: 'keyword-intent',
    11: 'keyword-intent',
    14: 'account-policy',
    15: 'sales-followup',
    16: 'sales-followup',
  };
  return rows.map((item) => {
    const category = categoryByStep[item.index];
    const needsEvidence = category ? ruleEvaluations.some((rule) => rule.readinessCategory === category && rule.status !== 'pass') : false;
    return { ...item, status: needsEvidence ? 'cần bằng chứng' : 'chưa làm' };
  });
}

function buildSearchCampaignGuide(): AdsSearchCampaignGuide {
  return {
    defaultMode: 'Chỉ lập kế hoạch - chưa chạy',
    structure: ['Một campaign Search', 'Một ad group chính', 'Có thể thêm một ad group test', 'Các nhóm còn lại: Chưa bật - chờ dữ liệu'],
    network: ['Search Network', 'Display Network mặc định tắt', 'Search Partners mặc định tắt để dễ đọc search terms và kiểm soát chất lượng traffic'],
    targeting: ['Hà Nội/khu vực giao hàng thật', 'Ưu tiên người hiện diện trong vị trí mục tiêu', 'Chạy theo giờ có người nghe điện thoại/trả lời Zalo'],
    bidding: [
      { strategy: 'Maximize Clicks', explanation: 'Google cố lấy nhiều click trong ngân sách.', whenToUse: 'Có thể dùng để test traffic khi tracking conversion chưa xác nhận.', warning: 'Phải đặt giới hạn CPC nếu cần và theo dõi search terms.' },
      { strategy: 'Manual CPC', explanation: 'Tự đặt CPC tối đa ở cấp keyword/ad group nếu tài khoản còn hỗ trợ.', whenToUse: 'Hữu ích khi muốn kiểm soát chi phí từng keyword.', warning: 'Không phải tài khoản nào cũng còn tùy chọn này.' },
      { strategy: 'Maximize Conversions', explanation: 'Google tối ưu theo conversion đã ghi nhận.', whenToUse: 'Chỉ cân nhắc khi conversion tracking đã xác nhận và có dữ liệu đủ.', warning: 'Không chọn khi tracking chưa xác nhận.' },
      { strategy: 'Target CPA', explanation: 'Google cố đạt chi phí/conversion mục tiêu.', whenToUse: 'Khi có dữ liệu conversion thật ổn định.', warning: 'Không đặt target CPA 10.000đ nếu không có dữ liệu thật.' },
      { strategy: 'Maximize Conversion Value', explanation: 'Tối ưu tổng giá trị chuyển đổi.', whenToUse: 'Khi có giá trị đơn hàng/conversion đáng tin cậy.', warning: 'Không dùng nếu chưa đo doanh thu/giá trị.' },
      { strategy: 'Target ROAS', explanation: 'Tối ưu theo lợi tức doanh thu quảng cáo.', whenToUse: 'Khi ecommerce/value tracking đủ sạch.', warning: 'Không khẳng định đây luôn là chiến lược tốt nhất.' },
    ],
    keywordRules: ['Phân biệt keyword và search term', 'Exact/phrase trước, chưa dùng broad match', 'Negative keyword xét theo ngữ cảnh', 'Không copy toàn bộ 4.427 keyword', 'Không dùng Hòa Phát nếu brand config chưa xác nhận', 'GSC impression không phải bằng chứng đủ để chạy Ads'],
    copyRules: ['Headline tối đa 30 ký tự', 'Description tối đa 90 ký tự', 'Không tự tạo giá/bảo hành/khuyến mại/thương hiệu', 'Final URL phải được xác nhận', 'Không dùng claim rẻ nhất/số 1/chính hãng/miễn phí/giảm giá khi chưa xác nhận'],
  };
}

function buildAssetChecklist(): AdsAssetChecklistItem[] {
  return [
    { asset: 'Sitelink', instruction: 'Dẫn tới danh mục/sản phẩm/trang liên hệ đã xác nhận.', evidenceNeeded: 'URL từ website hoặc Supabase.', status: 'Cần kiểm tra' },
    { asset: 'Callout', instruction: 'Chỉ dùng điểm mạnh có bằng chứng.', evidenceNeeded: 'Cấu hình doanh nghiệp hoặc nội dung website.', status: 'Chỉ dùng khi xác nhận' },
    { asset: 'Structured snippet', instruction: 'Nhóm loại sản phẩm thật đang bán.', evidenceNeeded: 'Danh mục/sản phẩm trong Supabase.', status: 'Cần kiểm tra' },
    { asset: 'Call asset', instruction: 'Dùng số điện thoại nhận cuộc gọi thật.', evidenceNeeded: 'Số điện thoại doanh nghiệp đã xác nhận.', status: 'Chỉ dùng khi xác nhận' },
    { asset: 'Location asset', instruction: 'Dùng khi địa chỉ/Google Business Profile xác nhận.', evidenceNeeded: 'Địa chỉ hoặc GBP chính thức.', status: 'Chỉ dùng khi xác nhận' },
    { asset: 'Image asset', instruction: 'Dùng ảnh sản phẩm/lắp đặt thật.', evidenceNeeded: 'Ảnh từ website/Supabase.', status: 'Cần kiểm tra' },
    { asset: 'Price/promotion asset', instruction: 'Chỉ dùng khi có giá/khuyến mại thật được duyệt.', evidenceNeeded: 'Bảng giá/khuyến mại xác nhận.', status: 'Chỉ dùng khi xác nhận' },
  ];
}

function buildRemediationPlan(readiness: AdsReadinessScore): string[] {
  return [
    'Dán nguyên văn cảnh báo Google Ads và ghi nguồn bằng chứng.',
    'Xác nhận billing, advertiser verification, policy manager và campaign status.',
    'Xác nhận conversion action chính: phone click, Zalo click, form submit hoặc order completed.',
    'Kiểm tra final URL trên mobile, CTA gọi/Zalo/form và trạng thái 404.',
    'Lọc keyword theo intent mua, dedupe theo normalized keyword + match type + adGroupId.',
    ...readiness.hardBlockers.map((item) => 'Gỡ blocker: ' + item),
  ];
}

function buildConditionalTestPlan(canLaunch: boolean): string[] {
  if (!canLaunch) return ['Chưa hiển thị kế hoạch copy chạy Ads vì còn hard blocker. Chỉ làm checklist khắc phục trước.'];
  return [
    'Bật một campaign Search, một ad group chính.',
    'Ngân sách nhóm chính khoảng 70.000-90.000đ/ngày; nhóm test dùng phần còn lại, tổng không vượt ngân sách nhập.',
    'Display Network và Search Partners tắt mặc định.',
    'Exact/phrase trước, chưa dùng broad match.',
    'Theo dõi sau 2-4 giờ, 24 giờ, 3 ngày và 7 ngày.',
  ];
}

export function attachGoogleAdsRuleEngine(plan: GoogleAdsAiPlan, accountHistoryInput?: unknown, googleAds: GoogleAdsImportData | null = null): GoogleAdsAiPlan {
  const accountHistory = normalizeAdsAccountHistory(accountHistoryInput || plan.accountHistory);
  const ads = extractGoogleAdsImport(googleAds);
  const ruleEngineResult = evaluateGoogleAdsRules(buildGoogleAdsRuleEngineInput({
    accountHistory,
    adGroups: plan.adGroups || [],
    landingWarnings: plan.landingPageWarnings || [],
    googleAdsKeywordCount: ads?.rows.length ?? plan.sourceSummary.googleAdsKeywordCount ?? null,
    searchConsoleRowsCount: plan.sourceSummary.gscQueryPageRows || 0,
    productsCount: plan.sourceSummary.products || 0,
    blogsCount: plan.sourceSummary.blogPosts || 0,
    clustersCount: plan.sourceSummary.clusters || 0,
    seoKeywordsCount: plan.sourceSummary.seoKeywords || 0,
    workLogsCount: plan.sourceSummary.workLogs || 0,
    keywordMapCount: plan.sourceSummary.keywordMap || 0,
  }));
  const ruleEvaluations = ruleEngineResult.evaluations;
  const readinessScore = buildReadinessScore(ruleEngineResult);
  return {
    ...plan,
    accountHistory,
    ruleEvaluations,
    ruleEngineResult,
    readinessScore,
    accountPolicyDiagnostics: buildAccountPolicyDiagnostics(accountHistory, ruleEvaluations),
    conversionDiagnostics: buildConversionDiagnostics(accountHistory, ruleEvaluations),
    launchWizard: buildLaunchWizard(ruleEvaluations),
    remediationPlan: buildRemediationPlan(readinessScore),
    conditionalTestPlan: buildConditionalTestPlan(readinessScore.canLaunch),
    missingManualData: readinessScore.missingData,
  };
}

export function buildGoogleAdsPlannerPlan(input: GoogleAdsPlannerInput): GoogleAdsAiPlan {
  const now = new Date().toISOString();
  const ads = extractGoogleAdsImport(input.googleAds);
  const rows = (ads?.rows || [])
    .filter((row) => row.keyword)
    .sort((a, b) => toNumber(b.avg_monthly_searches) - toNumber(a.avg_monthly_searches))
    .slice(0, 5000);
  const gscMap = gscBestByQuery(input.searchConsoleRows);
  const keywordMap = extractKeywordMapEntries(input.keywordMap);
  const decisions = uniqueByKeyword(rows.map((row) => classifyKeyword(row, input, gscMap, keywordMap)));
  const runNow = decisions.filter((item) => item.decision === 'run-now').slice(0, 40);
  const testSmallBudget = decisions.filter((item) => item.decision === 'test-small-budget').slice(0, 50);
  const seoFirst = decisions.filter((item) => item.decision === 'seo-first').slice(0, 50);
  const doNotRun = decisions.filter((item) => item.decision === 'do-not-run').slice(0, 50);
  const negativeKeywords = buildNegativeKeywords(decisions);
  const adGroups = buildAdGroups([...runNow, ...testSmallBudget], negativeKeywords);
  const landingPageWarnings = buildLandingWarnings(decisions);
  const actionPlanToday = buildActionPlanToday(adGroups, negativeKeywords, landingPageWarnings);
  const campaignPlan = buildCampaignPlan(adGroups);
  const budgetSuggestion = buildBudgetSuggestion(adGroups);
  const matchTypeKeywords = buildMatchTypeKeywords(adGroups);
  const adCopies = buildAdCopies(adGroups);
  const followUpChecklist = buildFollowUpChecklist();
  const accountHistory = normalizeAdsAccountHistory(input.accountHistory, now);
  const ruleEngineResult = evaluateGoogleAdsRules(buildGoogleAdsRuleEngineInput({
    accountHistory,
    adGroups,
    landingWarnings: landingPageWarnings,
    googleAdsKeywordCount: ads?.summary.keywordCount || rows.length,
    searchConsoleRowsCount: input.searchConsoleRows.length,
    productsCount: input.products.length,
    blogsCount: input.blogs.length,
    clustersCount: input.clusters.length,
    seoKeywordsCount: input.seoKeywords.length,
    workLogsCount: input.workLogs.length,
    keywordMapCount: keywordMap.length,
  }));
  const ruleEvaluations = ruleEngineResult.evaluations;
  const readinessScore = buildReadinessScore(ruleEngineResult);
  const accountPolicyDiagnostics = buildAccountPolicyDiagnostics(accountHistory, ruleEvaluations);
  const conversionDiagnostics = buildConversionDiagnostics(accountHistory, ruleEvaluations);
  const funnelDiagnostics = buildFunnelDiagnostics(accountHistory);
  const launchWizard = buildLaunchWizard(ruleEvaluations);
  const searchCampaignGuide = buildSearchCampaignGuide();
  const assetChecklist = buildAssetChecklist();
  const remediationPlan = buildRemediationPlan(readinessScore);
  const conditionalTestPlan = buildConditionalTestPlan(readinessScore.canLaunch);
  const notes = [
    rows.length ? 'Đã đọc Google Ads / Keyword Planner import, không gọi Google Ads API.' : 'Chưa có dữ liệu Google Ads import.',
    input.searchConsoleRows.length ? 'Có đối chiếu Search Console Query+Page/API/CSV.' : 'Chưa có Query+Page, nên import thêm trước khi chạy ngân sách lớn.',
    keywordMap.length ? 'Có dùng keyword map để ưu tiên URL chính đã lưu.' : 'Chưa có keyword map hoặc chưa đọc được keyword map.',
    'Khuyến nghị dùng exact/phrase match trước, tránh broad match khi ngân sách nhỏ.',
    'Phân loại dự kiến - cần đối chiếu thông báo chính thức trong tài khoản Google Ads hoặc email.',
  ];
  return {
    version: 'google-ads-ai-plan-v1',
    generatedAt: now,
    source: 'manual-run',
    sourceSummary: {
      googleAdsKeywordCount: ads?.summary.keywordCount || rows.length,
      googleAdsUpdatedAt: ads?.lastUpdated || ads?.summary.lastUpdated || null,
      gscQueryPageRows: input.searchConsoleRows.length,
      gscRanges: input.gscRanges,
      products: input.products.length,
      blogPosts: input.blogs.length,
      clusters: input.clusters.length,
      seoKeywords: input.seoKeywords.length,
      workLogs: input.workLogs.length,
      keywordMap: keywordMap.length,
      notes,
    },
    counts: {
      runNow: decisions.filter((item) => item.decision === 'run-now').length,
      testSmallBudget: decisions.filter((item) => item.decision === 'test-small-budget').length,
      seoFirst: decisions.filter((item) => item.decision === 'seo-first').length,
      doNotRun: decisions.filter((item) => item.decision === 'do-not-run').length,
      negativeKeywords: negativeKeywords.length,
      adGroups: adGroups.length,
    },
    runNow,
    testSmallBudget,
    seoFirst,
    doNotRun,
    negativeKeywords,
    adGroups,
    actionPlanToday,
    campaignPlan,
    budgetSuggestion,
    matchTypeKeywords,
    adCopies,
    landingPageWarnings,
    followUpChecklist,
    accountHistory,
    ruleEvaluations,
    ruleEngineResult,
    accountPolicyDiagnostics,
    conversionDiagnostics,
    funnelDiagnostics,
    readinessScore,
    launchWizard,
    searchCampaignGuide,
    assetChecklist,
    remediationPlan,
    conditionalTestPlan,
    missingManualData: readinessScore.missingData,
    copyBlocks: {
      actionPlanToday: copyActionPlan(actionPlanToday),
      runKeywords: runNow.map((item) => item.keyword + '\t' + item.finalUrl + '\t' + item.reason).join('\n'),
      negativeKeywords: negativeKeywords.map((item) => item.keyword).join('\n'),
      campaignStructure: copyCampaignStructure(adGroups),
      matchTypeKeywords: copyMatchTypeKeywords(matchTypeKeywords),
      adCopy: copyAdText(adGroups),
      followUpChecklist: followUpChecklist.join('\n'),
    },
  };
}

export function appendGoogleAdsPlannerHistory(plan: GoogleAdsAiPlan, existing: unknown): GoogleAdsAiHistory {
  const value = normalizePlannerPayload(existing);
  const previous = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).items)
      ? (value as Record<string, unknown>).items as unknown[]
      : [];
  const item: GoogleAdsAiHistoryItem = {
    id: 'ads-ai-' + plan.generatedAt,
    generatedAt: plan.generatedAt,
    totalKeywords: plan.sourceSummary.googleAdsKeywordCount,
    runAdsCount: plan.counts.runNow,
    testAdsCount: plan.counts.testSmallBudget,
    seoFirstCount: plan.counts.seoFirst,
    negativeCount: plan.counts.negativeKeywords,
    campaignCount: plan.counts.adGroups,
  };
  return {
    version: 'google-ads-ai-history-v1',
    updatedAt: plan.generatedAt,
    items: [item, ...previous.filter((entry) => Boolean((entry as Record<string, unknown>)?.id)).slice(0, 49) as GoogleAdsAiHistoryItem[]],
  };
}

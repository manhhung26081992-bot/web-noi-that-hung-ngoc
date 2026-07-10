export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type SeoPriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type SeoCategorySource = 'supabase' | 'menu';

export interface SeoOverview {
  products: number;
  blogPosts: number;
  categories: number;
  generatedUrls: number;
  categorySource: SeoCategorySource;
  staticUrls: number;
  activeCategoryUrls: number;
  clusters?: number;
  keywords?: number;
  tasks?: number;
  logs?: number;
  goals?: number;
  priorities?: number;
  progress?: number;
  doNotTouch?: number;
}

export interface ChartPoint { date: string; impressions: number; clicks: number; }
export interface SearchConsoleMetrics { status: ConnectionStatus; message: string; impressions: number; clicks: number; ctr: number; averagePosition: number; chart7Days: ChartPoint[]; chart28Days: ChartPoint[]; topQueries: string[]; topPages: string[]; topCountries: string[]; topDevices: string[]; }
export interface GoogleAdsKeyword { id: string; keyword: string; competition: 'low' | 'medium' | 'high' | 'unknown'; monthlySearch: number; status: ConnectionStatus; }
export interface SeoPriority { id: string; keyword: string; rating: number; note?: string; updated_at?: string; }
export interface TodayTask { id: string; title: string; completed: boolean; task_date: string; updated_at?: string; cluster?: string; priority?: string | number; status?: string; }
export interface BrokenUrlItem { id: string; url: string; source?: string; status: 'new' | 'redirected' | 'ignored'; redirectTo?: string; detectedAt?: string; }
export interface SitemapStatus { url: string; lastGenerated?: string; urlCount: number; robotsOk: boolean; sitemapOk: boolean; }
export interface IndexStatusItem { id: string; url: string; created_at: string; submitted: boolean; indexed: boolean; }
export interface SeoNote { id: string; content: string; updated_at?: string; }
export interface SystemHealthItem { name: string; status: 'ok' | 'warning' | 'error' | 'pending'; detail: string; }
export interface SeoHealthSnapshot { brokenUrls: BrokenUrlItem[]; sitemap: SitemapStatus; systemHealth: SystemHealthItem[]; }

export interface SeoCommand { id: string; title: string; detail: string; level: SeoPriorityLevel; source: string; }
export interface SeoKeyword {
  id: string;
  keyword: string;
  cluster?: string;
  target_url: string;
  intent?: string;
  priority: number;
  status: string;
  current_position: number | null;
  current_impression: number | null;
  current_click?: number | null;
  note?: string;
  created_at?: string;
  updated_at?: string;
}
export interface SeoLog {
  id: string;
  log_date: string;
  action: string;
  target: string;
  note?: string;
  type?: string;
  title?: string;
  description?: string;
  related_url?: string;
  cluster?: string;
  created_at?: string;
}
export interface SeoProgress { id: string; cluster: string; progress: number; note?: string; updated_at?: string; }
export interface SeoGoal { id: string; title: string; target_value: number; current_value: number; unit?: string; note?: string; updated_at?: string; }
export interface LocalSeoItem { id: string; name: string; value: string; status: 'ok' | 'warning' | 'missing'; updated_at?: string; }
export interface AiSeoScore {
  technical: number;
  content: number;
  data: number;
  integration: number;
  overall: number;
  details: {
    supabaseOk: boolean;
    sitemapOk: boolean;
    robotsOk: boolean;
    hasProducts: boolean;
    hasBlogPosts: boolean;
    searchConsoleConnected: boolean;
    googleAdsConnected: boolean;
    canonicalOk: boolean;
  };
}
export interface TodaySummary { products: number; blogPosts: number; errors: number; urls: number; productsTotal: number; blogPostsTotal: number; }
export interface AiInsight { id: string; text: string; level: SeoPriorityLevel; }

export interface SeoCluster {
  id: string;
  name: string;
  main_url: string;
  priority: number;
  status: string;
  product_count: number;
  post_count: number;
  internal_link_count: number;
  internal_link_measured?: boolean;
  keyword_count?: number;
  task_count?: number;
  log_count?: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}
export interface ProductSeoItem {
  id: string | number;
  name: string;
  slug: string;
  category?: string | null;
  parent_slug?: string | null;
  image?: string | null;
  images?: unknown;
  realInstallImages?: unknown;
  description?: string | null;
  detailDescription?: string | null;
  specs?: unknown;
  features?: unknown;
  created_at?: string | null;
  qualityScore?: number;
  checks?: {
    mainImage: boolean;
    multipleImages: boolean;
    alt: boolean;
    description: boolean;
    detailDescription: boolean;
    specs: boolean;
    features: boolean;
    category: boolean;
    slug: boolean;
    internalLink: boolean;
    faq: boolean;
  };
  issues: string[];
  action: string;
}
export interface SeoBlogQualityItem {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  score: number;
  checks: {
    content: boolean;
    internalLink: boolean;
    image: boolean;
    slug: boolean;
    meta: boolean;
    faq: boolean;
    keyword: boolean;
  };
  issues: string[];
  action: string;
}
export interface V6Decision { id: string; priority: 1 | 2 | 3; title: string; reason: string; action: string; level: SeoPriorityLevel; source: string; }
export interface V6Opportunity { id: string; cluster: string; score: number; reasons: string[]; nextAction: string; }
export interface V6Notification { id: string; title: string; detail: string; level: SeoPriorityLevel; count?: number; }
export interface V6RadarPoint { label: string; score: number; }
export interface AiRecommendationHistoryItem { id: string; date: string; suggestion: string; done: boolean; result?: string; }
export interface V6Analysis {
  decisions: V6Decision[];
  opportunities: V6Opportunity[];
  productRanking: ProductSeoItem[];
  blogRanking: SeoBlogQualityItem[];
  notifications: V6Notification[];
  radar: V6RadarPoint[];
  progress: { yesterday: number; today: number; sevenDays: number; thirtyDays: number; improved: string[]; };
  insights: string[];
}

export interface ContentOpportunity {
  id: string;
  cluster: string;
  suggestion: string;
  reason: string;
  level: SeoPriorityLevel;
}
export interface InternalLinkSuggestion {
  id: string;
  post_title: string;
  post_url: string;
  detected_keyword: string;
  target_url: string;
  anchor: string;
}
export interface DoNotTouchItem {
  id: string;
  url: string;
  reason: string;
  until_date: string;
  status: string;
  created_at?: string;
}
export interface SeoCompetitor {
  id: string;
  name: string;
  domain: string;
  note?: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}
export interface RoadmapWeek {
  week: string;
  focus: string;
  tasks: string[];
}
export interface AiDailyBrief {
  id: string;
  text: string;
  level: SeoPriorityLevel;
}


export type GoogleAdsRecommendation = 'SEO trước' | 'Ads thử' | 'Cả hai' | 'Theo dõi' | 'Không ưu tiên';

export interface GoogleAdsKeywordImportRow {
  id: string;
  keyword: string;
  avg_monthly_searches?: number;
  competition?: string;
  competition_index?: number;
  low_top_of_page_bid?: number;
  high_top_of_page_bid?: number;
  cpc?: number;
  currency?: string;
  ad_impression_share?: number;
  organic_impression_share?: number;
  organic_average_position?: number;
  monthlySearches?: Record<string, number | null>;
  campaign?: string;
  ad_group?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  cost?: number;
  conversions?: number;
  conversion_rate?: number;
  cluster?: string;
  businessPriority: number;
  commercialIntent: number;
}

export interface GoogleAdsImportSummary {
  keywordCount: number;
  totalSearchVolume: number;
  averageCpc: number | null;
  averageCompetitionIndex: number | null;
  totalClicks: number;
  totalImpressions: number;
  totalCost: number;
  totalConversions: number;
  hasAdsPerformance: boolean;
  lastUpdated: string;
}

export interface GoogleAdsOpportunity {
  id: string;
  keyword: string;
  cluster: string;
  score: number;
  recommendation: GoogleAdsRecommendation;
  reason: string;
  action: string;
  row: GoogleAdsKeywordImportRow;
}

export interface SeoAdsKeywordMatrixRow {
  id: string;
  keyword: string;
  cluster: string;
  searchConsolePosition?: number;
  searchConsoleImpressions?: number;
  searchConsoleClicks?: number;
  adsSearchVolume?: number;
  cpc?: number;
  competition?: string;
  recommendation: GoogleAdsRecommendation;
  reason: string;
}

export type GoogleAdsImportMode = 'merge' | 'replace';

export interface GoogleAdsImportSource {
  fileName?: string;
  importedAt: string;
  rowCount: number;
  mode: GoogleAdsImportMode;
  addedCount?: number;
  updatedCount?: number;
  totalCount?: number;
}

export interface GoogleAdsImportMergeResult {
  data: GoogleAdsImportData;
  source: GoogleAdsImportSource;
  addedCount: number;
  updatedCount: number;
  totalCount: number;
}

export interface GoogleAdsImportData {
  source: 'import';
  lastUpdated: string;
  rows: GoogleAdsKeywordImportRow[];
  summary: GoogleAdsImportSummary;
  topVolume: GoogleAdsKeywordImportRow[];
  lowCpcGoodVolume: GoogleAdsKeywordImportRow[];
  lowCompetition: GoogleAdsKeywordImportRow[];
  highCommercial: GoogleAdsKeywordImportRow[];
  shouldSeo: GoogleAdsOpportunity[];
  shouldAds: GoogleAdsOpportunity[];
  shouldWatch: GoogleAdsOpportunity[];
  wasteKeywords: GoogleAdsKeywordImportRow[];
  lowCtrKeywords: GoogleAdsKeywordImportRow[];
  highCpcKeywords: GoogleAdsKeywordImportRow[];
  goodConversionKeywords: GoogleAdsKeywordImportRow[];
  highImpressionLowClickKeywords: GoogleAdsKeywordImportRow[];
  adGroupsToOptimize: Array<{ name: string; reason: string; cost: number; conversions: number; clicks: number; impressions: number; }>;
  opportunities: GoogleAdsOpportunity[];
  matrix: SeoAdsKeywordMatrixRow[];
  sources?: GoogleAdsImportSource[];
  lastImportedAt?: string;
}

export type SearchConsoleRange = '7d' | '28d' | '90d';
export type SearchConsoleRequestType = 'overview' | 'queries' | 'pages' | 'devices' | 'countries' | 'opportunities';
export type SearchConsoleSource = 'api' | 'fallback' | 'import';

export interface SearchConsoleOverview {
  connected: boolean;
  reason?: 'missing_credentials' | 'permission_denied' | 'api_error' | 'manual_import' | 'unknown';
  message: string;
  siteUrl: string;
  range: SearchConsoleRange;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  lastUpdated?: string;
}

export interface SearchConsoleQuery {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleDevice {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleCountry {
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleDatePoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleOpportunity {
  id: string;
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  priority: 1 | 2 | 3;
  reason: string;
  action: string;
  cluster?: string;
}

export interface SearchConsoleV7Data {
  source: SearchConsoleSource;
  selectedType: SearchConsoleRequestType;
  overview: SearchConsoleOverview;
  queries: SearchConsoleQuery[];
  pages: SearchConsolePage[];
  devices: SearchConsoleDevice[];
  countries: SearchConsoleCountry[];
  trend: SearchConsoleDatePoint[];
  opportunities: SearchConsoleOpportunity[];
}


export interface IndexSummaryManual {
  indexedUrls: number | null;
  notIndexedUrls: number | null;
  mainIssue: string;
  lastCheckedDate: string;
  updatedAt?: string;
}

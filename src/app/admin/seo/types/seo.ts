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
}

export interface ChartPoint { date: string; impressions: number; clicks: number; }
export interface SearchConsoleMetrics { status: ConnectionStatus; message: string; impressions: number; clicks: number; ctr: number; averagePosition: number; chart7Days: ChartPoint[]; chart28Days: ChartPoint[]; topQueries: string[]; topPages: string[]; topCountries: string[]; topDevices: string[]; }
export interface GoogleAdsKeyword { id: string; keyword: string; competition: 'low' | 'medium' | 'high' | 'unknown'; monthlySearch: number; status: ConnectionStatus; }
export interface SeoPriority { id: string; keyword: string; rating: number; note?: string; updated_at?: string; }
export interface TodayTask { id: string; title: string; completed: boolean; task_date: string; updated_at?: string; }
export interface BrokenUrlItem { id: string; url: string; source?: string; status: 'new' | 'redirected' | 'ignored'; redirectTo?: string; detectedAt?: string; }
export interface SitemapStatus { url: string; lastGenerated?: string; urlCount: number; robotsOk: boolean; sitemapOk: boolean; }
export interface IndexStatusItem { id: string; url: string; created_at: string; submitted: boolean; indexed: boolean; }
export interface SeoNote { id: string; content: string; updated_at?: string; }
export interface SystemHealthItem { name: string; status: 'ok' | 'warning' | 'error' | 'pending'; detail: string; }
export interface SeoHealthSnapshot { brokenUrls: BrokenUrlItem[]; sitemap: SitemapStatus; systemHealth: SystemHealthItem[]; }

export interface SeoCommand { id: string; title: string; detail: string; level: SeoPriorityLevel; source: string; }
export interface SeoKeyword { id: string; keyword: string; target_url: string; priority: number; status: string; current_position: number | null; current_impression: number | null; note?: string; updated_at?: string; }
export interface SeoLog { id: string; log_date: string; action: string; target: string; note?: string; created_at?: string; }
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

export type SearchConsoleDevice = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';

export interface SearchConsoleRow {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  query?: string;
  page?: string;
  device?: SearchConsoleDevice;
  country?: string;
  date?: string;
}

export interface SearchConsoleTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface SearchConsoleV5Data {
  status: 'mock' | 'connected' | 'error';
  message: string;
  overview: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  topQueries: SearchConsoleRow[];
  topPages: SearchConsoleRow[];
  keywordTrend: SearchConsoleTrendPoint[];
  pageTrend: SearchConsoleTrendPoint[];
  newQueries: SearchConsoleRow[];
  pagesLosingImpression: SearchConsoleRow[];
}

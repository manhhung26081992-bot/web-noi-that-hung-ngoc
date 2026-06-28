import type { SearchConsoleMetrics } from '../types/seo';

export async function getSearchConsoleMetrics(): Promise<SearchConsoleMetrics> {
  return { status: 'disconnected', message: 'Chưa kết nối Search Console', impressions: 0, clicks: 0, ctr: 0, averagePosition: 0, chart7Days: [], chart28Days: [], topQueries: [], topPages: [], topCountries: [], topDevices: [] };
}

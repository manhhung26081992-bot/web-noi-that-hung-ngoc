import type { GoogleAdsKeyword } from '../types/seo';

export async function getGoogleAdsKeywords(): Promise<{ message: string; keywords: GoogleAdsKeyword[] }> {
  return { message: 'Chưa kết nối Google Ads', keywords: [] };
}

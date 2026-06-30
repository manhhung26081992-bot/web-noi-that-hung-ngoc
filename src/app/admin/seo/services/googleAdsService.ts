import type { GoogleAdsKeyword } from '../types/seo';

export async function getGoogleAdsKeywords(): Promise<{ message: string; keywords: GoogleAdsKeyword[] }> {
  return { message: 'Chưa import dữ liệu Google Ads', keywords: [] };
}

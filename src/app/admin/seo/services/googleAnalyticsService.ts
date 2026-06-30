import type { ConnectionStatus } from '../types/seo';

export interface GoogleAnalyticsSnapshot {
  status: ConnectionStatus;
  message: string;
  users: number;
  sessions: number;
  topLandingPages: string[];
}

export async function getGoogleAnalyticsSnapshot(): Promise<GoogleAnalyticsSnapshot> {
  return { status: 'disconnected', message: 'Chưa có dữ liệu Google Analytics thủ công', users: 0, sessions: 0, topLandingPages: [] };
}

import type { ConnectionStatus } from '../types/seo';

export interface GoogleBusinessSnapshot {
  status: ConnectionStatus;
  message: string;
  businessName: string;
  profileUrl?: string;
}

export async function getGoogleBusinessSnapshot(): Promise<GoogleBusinessSnapshot> {
  return { status: 'disconnected', message: 'Chưa kết nối Google Business API', businessName: '' };
}

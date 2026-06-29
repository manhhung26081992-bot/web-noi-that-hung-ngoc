import { getMockSearchConsoleV5Data } from './mock';
import type { SearchConsoleV5Data } from './types';

export async function getSearchConsoleV5Data(): Promise<SearchConsoleV5Data> {
  // V5 architecture placeholder: sau này đổi phần này sang server-only Google API client.
  // Không dùng service role hoặc Google credential ở client.
  return getMockSearchConsoleV5Data();
}

export type { SearchConsoleRow, SearchConsoleTrendPoint, SearchConsoleV5Data } from './types';

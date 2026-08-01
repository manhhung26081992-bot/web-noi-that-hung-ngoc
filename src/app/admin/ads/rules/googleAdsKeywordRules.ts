import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

const category = 'KEYWORDS_SEARCH_TERMS' as const;
const readinessCategory = 'keyword-intent' as const;

export const googleAdsKeywordRules: GoogleAdsRuleDefinition[] = [
  defineGoogleAdsRule({
    id: 'platform-keyword-import',
    title: 'Có keyword đủ điều kiện từ dữ liệu import',
    source: 'PLATFORM_RULE',
    sourceId: 'GOOGLE_ADS_KEYWORDS',
    category,
    readinessCategory,
    severity: 'critical',
    summaryVi: 'Không có Keyword Planner/Google Ads import thì không copy keyword chạy.',
    canBlockLaunch: true,
    unknownBlocksLaunch: true,
    defaultStatus: 'unknown',
    missingEvidence: ['Google Ads Keyword Planner import'],
    evidenceKeys: ['googleAdsKeywordCount'],
    recommendedActionVi: 'Import Keyword Planner và lọc exact/phrase theo intent.',
    prohibitedActionVi: 'Không copy toàn bộ keyword hoặc dùng GSC impression thay bằng dữ liệu Ads.',
    scoreImpact: 15,
  }),
  ...([
    ['keyword-exact-phrase-first', 'Exact/phrase được ưu tiên trong test nhỏ'],
    ['keyword-no-broad-in-first-test', 'Không dùng broad match giai đoạn đầu'],
    ['keyword-intent-buying-reviewed', 'Intent mua hàng/dịch vụ được review'],
    ['keyword-negative-list-present', 'Negative keyword có lý do'],
    ['keyword-search-terms-monitoring-ready', 'Có lịch đọc Search terms sau launch'],
    ['keyword-no-severe-irrelevant-terms', 'Dừng nếu search terms lệch nặng'],
    ['keyword-dedupe-normalized-match', 'Dedupe theo normalized keyword + match type + adGroup'],
    ['keyword-url-map-consistent', 'Keyword map khớp final URL'],
    ['keyword-low-volume-labelled-test', 'Long-tail thiếu dữ liệu được gắn test nhỏ'],
    ['keyword-no-competitor-risk-unreviewed', 'Không dùng competitor terms chưa review'],
    ['keyword-gsc-used-as-context-only', 'GSC chỉ là ngữ cảnh, không thay dữ liệu Ads'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('gsc') ? 'BUSINESS_GUARDRAIL' : 'PLATFORM_RULE',
    sourceId: id.includes('gsc') ? 'BUSINESS_GUARDRAIL_INTERNAL' : 'GOOGLE_ADS_KEYWORDS',
    category,
    readinessCategory,
    severity: id.includes('severe') ? 'critical' : 'medium',
    summaryVi: 'Keyword/search terms rule để giữ intent và ngân sách nhỏ có kiểm soát.',
    stopRule: id.includes('severe'),
    canBlockLaunch: id.includes('broad') || id.includes('severe'),
    defaultStatus: 'unknown',
    missingEvidence: ['Keyword list', 'Negative list', 'Search terms nếu đã chạy'],
    evidenceKeys: ['googleAdsKeywordCount', 'adGroups.keywordCount', 'negativeKeywords'],
    recommendedActionVi: 'Dùng exact/phrase, đọc search terms và thêm negative có lý do.',
    prohibitedActionVi: 'Không dùng broad hoặc search terms lệch nặng khi ngân sách nhỏ.',
    scoreImpact: id.includes('severe') ? 15 : 2,
  })),
];

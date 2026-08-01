import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsOptimizationRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['optimization-no-auto-apply-all', 'Không auto-apply toàn bộ recommendations'],
    ['optimization-score-context-only', 'Optimization score chỉ là tín hiệu phụ'],
    ['optimization-observation-window-2h-24h-3d-7d', 'Có lịch quan sát 2-4h/24h/3d/7d'],
    ['optimization-search-terms-first', 'Search terms là ưu tiên tối ưu đầu'],
    ['optimization-landing-fixes-before-budget', 'Sửa landing/tracking trước khi tăng budget'],
    ['optimization-one-change-at-a-time', 'Không đổi nhiều thứ cùng lúc'],
    ['optimization-pause-rules-defined', 'Quy tắc giảm/dừng rõ'],
    ['optimization-lead-quality-reviewed', 'Chất lượng lead được review với team bán hàng'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('score') || id.includes('auto') ? 'PLATFORM_RULE' : 'BUSINESS_GUARDRAIL',
    sourceId: id.includes('score') || id.includes('auto') ? 'GOOGLE_ADS_OPTIMIZATION' : 'BUSINESS_GUARDRAIL_INTERNAL',
    category: 'OPTIMIZATION',
    readinessCategory: id.includes('lead') ? 'sales-followup' : 'campaign-settings',
    severity: 'medium',
    summaryVi: 'Optimization rule giữ việc đọc tín hiệu sau launch không bị automation hoặc cảm tính dẫn dắt.',
    canBlockLaunch: false,
    defaultStatus: 'unknown',
    missingEvidence: ['Monitoring plan', 'Search terms plan'],
    evidenceKeys: ['workLogsCount', 'notes'],
    recommendedActionVi: 'Theo dõi dữ liệu theo mốc và ghi lý do mỗi thay đổi.',
    prohibitedActionVi: 'Không áp dụng recommendation hàng loạt khi chưa hiểu tác động.',
    scoreImpact: 1,
  })),
];

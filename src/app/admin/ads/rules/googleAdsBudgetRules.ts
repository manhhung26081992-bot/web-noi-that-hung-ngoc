import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsBudgetRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['budget-daily-budget-known', 'Ngân sách/ngày đã nhập hoặc có đề xuất rõ', 'high', 4],
    ['budget-user-cap-not-exceeded', 'Không vượt cap người dùng', 'critical', 10],
    ['budget-shared-budget-not-accidental', 'Không dùng shared budget ngoài ý muốn', 'medium', 2],
    ['budget-limited-by-budget-understood', 'Limited by budget được hiểu đúng, không tăng bừa', 'medium', 2],
    ['budget-test-allocation-small', 'Test allocation nhỏ và có kiểm soát', 'medium', 2],
    ['budget-abnormal-spend-stop', 'Dừng khi có chi tiêu bất thường', 'critical', 10],
    ['budget-no-fix-by-money', 'Không sửa lỗi policy/tracking bằng tăng tiền', 'high', 4],
    ['budget-monitoring-cadence-ready', 'Có lịch đọc spend 2-4h/24h/3d/7d', 'medium', 2],
  ] as const
  ).map(([id, title, severity, score]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('user-cap') || id.includes('fix-by-money') ? 'BUSINESS_GUARDRAIL' : 'PLATFORM_RULE',
    sourceId: id.includes('user-cap') || id.includes('fix-by-money') ? 'BUSINESS_GUARDRAIL_INTERNAL' : 'GOOGLE_ADS_BUDGETS',
    category: 'BIDDING_BUDGET',
    readinessCategory: 'campaign-settings',
    severity: severity as GoogleAdsRuleDefinition['severity'],
    summaryVi: 'Budget rule để tránh overspend và quyết định sai do thiếu dữ liệu.',
    stopRule: severity === 'critical',
    canBlockLaunch: severity === 'critical',
    unknownBlocksLaunch: id.includes('daily-budget-known'),
    defaultStatus: 'unknown',
    missingEvidence: ['Daily budget', 'Actual spend', 'Budget settings'],
    evidenceKeys: ['dailyBudget', 'actualSpend', 'adGroups.dailyBudgetAmount'],
    recommendedActionVi: 'Giữ ngân sách test nhỏ, có lịch theo dõi rõ.',
    prohibitedActionVi: 'Không vượt cap hoặc tăng budget khi blocker chưa xử lý.',
    scoreImpact: Number(score),
  })),
];

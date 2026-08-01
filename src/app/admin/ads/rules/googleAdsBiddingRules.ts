import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsBiddingRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['bidding-strategy-compatible-with-tracking', 'Bidding strategy phù hợp chất lượng tracking', 'critical', 10],
    ['bidding-no-maximize-conversions-before-tracking', 'Không dùng Maximize Conversions khi tracking chưa rõ', 'critical', 10],
    ['bidding-manual-or-clicks-test-rationale', 'Manual CPC/Max Clicks có lý do test nhỏ', 'medium', 2],
    ['bidding-target-cpa-not-too-low', 'Target CPA không đặt vô lý khi thiếu dữ liệu', 'high', 4],
    ['bidding-learning-period-respected', 'Tôn trọng giai đoạn học, không đổi liên tục', 'medium', 2],
    ['bidding-cpc-cap-reviewed', 'CPC cap được review theo ngành/nội thất', 'medium', 2],
    ['bidding-no-auto-apply-recommendations', 'Không auto-apply recommendation bidding', 'high', 4],
    ['bidding-portfolio-strategy-not-accidental', 'Không dùng portfolio strategy ngoài ý muốn', 'medium', 2],
  ] as const
  ).map(([id, title, severity, score]) => defineGoogleAdsRule({
    id,
    title,
    source: 'PLATFORM_RULE',
    sourceId: 'GOOGLE_ADS_BIDDING',
    category: 'BIDDING_BUDGET',
    readinessCategory: 'campaign-settings',
    severity: severity as GoogleAdsRuleDefinition['severity'],
    summaryVi: 'Bidding phải dựa trên tracking và ngân sách thật.',
    canBlockLaunch: severity === 'critical',
    unknownBlocksLaunch: severity === 'critical',
    defaultStatus: 'unknown',
    missingEvidence: ['Bidding settings', 'Conversion tracking status'],
    evidenceKeys: ['campaignStatus', 'conversionTrackingStatus'],
    recommendedActionVi: 'Chọn bidding thận trọng trong test ngân sách nhỏ.',
    prohibitedActionVi: 'Không dùng automation khi tín hiệu conversion chưa sạch.',
    scoreImpact: Number(score),
  })),
];

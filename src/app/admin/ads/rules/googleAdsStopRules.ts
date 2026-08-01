import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

const stopRows = [
  ['stop-account-suspension-warning', 'Dừng khi có suspension/cancellation warning', 'GOOGLE_ADS_ACCOUNT_STATUS', 'ACCOUNT_SECURITY', 'account-policy'],
  ['stop-billing-failure', 'Dừng khi billing/payment failure', 'GOOGLE_ADS_BILLING', 'BILLING_VERIFICATION', 'billing-verification'],
  ['stop-verification-required-blocker', 'Dừng khi advertiser verification đang chặn', 'GOOGLE_ADS_ADVERTISER_VERIFICATION', 'BILLING_VERIFICATION', 'billing-verification'],
  ['stop-mass-ad-rejection', 'Dừng khi ads bị từ chối hàng loạt', 'AD_POLICY_MISREPRESENTATION', 'POLICY_MISREPRESENTATION', 'account-policy'],
  ['stop-landing-unavailable', 'Dừng khi landing unavailable/404', 'AD_POLICY_DESTINATION', 'LANDING_PAGE_DESTINATION', 'landing-page'],
  ['stop-abnormal-redirect', 'Dừng khi redirect bất thường', 'AD_POLICY_DESTINATION', 'LANDING_PAGE_DESTINATION', 'landing-page'],
  ['stop-suspected-compromise-malware', 'Dừng khi nghi compromise/malware', 'AD_POLICY_DESTINATION', 'LANDING_PAGE_DESTINATION', 'landing-page'],
  ['stop-conversion-tracking-stopped', 'Dừng khi conversion tracking stopped', 'GOOGLE_ADS_CONVERSIONS', 'CONVERSION', 'conversion-tracking'],
  ['stop-duplicate-conversion-spike', 'Dừng khi conversion bị spike trùng lặp', 'GOOGLE_ADS_API_CONVERSIONS', 'CONVERSION', 'conversion-tracking'],
  ['stop-abnormal-spend', 'Dừng khi chi tiêu bất thường', 'GOOGLE_ADS_BUDGETS', 'BIDDING_BUDGET', 'campaign-settings'],
  ['stop-severe-irrelevant-search-terms', 'Dừng khi search terms lệch nặng', 'GOOGLE_ADS_KEYWORDS', 'KEYWORDS_SEARCH_TERMS', 'keyword-intent'],
  ['stop-user-spend-cap-reached', 'Dừng khi chạm/vượt cap người dùng', 'BUSINESS_GUARDRAIL_INTERNAL', 'BIDDING_BUDGET', 'campaign-settings'],
  ['stop-user-requested-stop', 'Dừng khi người dùng yêu cầu dừng', 'BUSINESS_GUARDRAIL_INTERNAL', 'OPTIMIZATION', 'sales-followup'],
] as const;

export const googleAdsStopRules: GoogleAdsRuleDefinition[] = stopRows.map(([id, title, sourceId, category, readinessCategory]) => defineGoogleAdsRule({
  id,
  title,
  source: sourceId === 'BUSINESS_GUARDRAIL_INTERNAL' ? 'BUSINESS_GUARDRAIL' : sourceId.startsWith('AD_POLICY') || sourceId.includes('VERIFICATION') ? 'OFFICIAL_POLICY' : 'PLATFORM_RULE',
  sourceId,
  category,
  readinessCategory,
  severity: 'critical',
  summaryVi: 'STOP_RULE severity critical: khi có bằng chứng liên quan thì canBlockLaunch=true.',
  stopRule: true,
  canBlockLaunch: true,
  unknownBlocksLaunch: false,
  defaultStatus: 'not_applicable',
  missingEvidence: ['Bằng chứng stop condition nếu có'],
  evidenceKeys: ['accountStatus', 'billingStatus', 'policyStatus', 'warningMessage', 'landingWarnings', 'conversionTrackingStatus', 'actualSpend', 'notes'],
  recommendedActionVi: 'Dừng launch/copy và xử lý nguyên nhân trước.',
  prohibitedActionVi: 'Không tiếp tục chạy khi stop rule có bằng chứng fail.',
  scoreImpact: 20,
}));

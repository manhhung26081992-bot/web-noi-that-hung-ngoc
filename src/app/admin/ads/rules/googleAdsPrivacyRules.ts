import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsPrivacyRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['privacy-no-password-token-storage', 'Không lưu password/OTP/token trong dashboard'],
    ['privacy-no-card-storage', 'Không lưu số thẻ/thông tin thanh toán nhạy cảm'],
    ['privacy-lead-log-minimized', 'Lead log chỉ chứa dữ liệu cần thiết'],
    ['privacy-consent-for-forms-reviewed', 'Form/lead consent được review nếu thu thập dữ liệu'],
    ['privacy-customer-match-not-used', 'Customer Match không áp dụng trong planner này'],
    ['privacy-remarketing-not-used', 'Remarketing không áp dụng trong test Search đầu'],
    ['privacy-enhanced-conversions-not-configured-here', 'Enhanced conversions không cấu hình trong planner'],
    ['privacy-data-source-labeled', 'Nguồn dữ liệu Supabase/local cache được gắn nhãn'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('password') || id.includes('card') ? 'BUSINESS_GUARDRAIL' : 'PLATFORM_RULE',
    sourceId: id.includes('password') || id.includes('card') ? 'BUSINESS_GUARDRAIL_INTERNAL' : 'GOOGLE_ADS_CONVERSIONS',
    category: 'PRIVACY_DATA',
    readinessCategory: id.includes('password') || id.includes('card') ? 'billing-verification' : 'conversion-tracking',
    severity: id.includes('password') || id.includes('card') ? 'critical' : 'medium',
    summaryVi: 'Privacy/data guardrail: planner không lưu secret, thẻ, OTP hoặc dữ liệu nhạy cảm không cần thiết.',
    canBlockLaunch: id.includes('password') || id.includes('card'),
    defaultStatus: id.includes('not-used') || id.includes('not-configured') ? 'not_applicable' : 'unknown',
    missingEvidence: ['Data handling evidence'],
    evidenceKeys: ['notes', 'evidenceSource'],
    recommendedActionVi: 'Giữ Supabase là nguồn lưu chính, localStorage chỉ cache/fallback.',
    prohibitedActionVi: 'Không nhập hoặc lưu password, OTP, token, số thẻ.',
    scoreImpact: id.includes('password') || id.includes('card') ? 10 : 1,
  })),
];

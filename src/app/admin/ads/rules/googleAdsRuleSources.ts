import type { GoogleAdsRuleDefinition, GoogleAdsRuleDefinitionDraft, GoogleAdsRuleSourceMeta } from './googleAdsRuleTypes';

export const GOOGLE_ADS_RULE_CATALOG_VERSION = 'google-ads-rule-catalog-2026-08-01';
export const GOOGLE_ADS_RULE_SOURCE_CHECKED_AT = '2026-08-01';

export const GOOGLE_ADS_RULE_SOURCE_REGISTRY: Record<string, GoogleAdsRuleSourceMeta> = {
  GOOGLE_ADS_ACCOUNT_STATUS: {
    sourceId: 'GOOGLE_ADS_ACCOUNT_STATUS',
    sourceUrl: 'https://support.google.com/google-ads/answer/1722120',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về trạng thái/tạm ngưng tài khoản.',
  },
  GOOGLE_ADS_BILLING: {
    sourceId: 'GOOGLE_ADS_BILLING',
    sourceUrl: 'https://support.google.com/google-ads/answer/2375431',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về thanh toán và phương thức thanh toán.',
  },
  GOOGLE_ADS_ADVERTISER_VERIFICATION: {
    sourceId: 'GOOGLE_ADS_ADVERTISER_VERIFICATION',
    sourceUrl: 'https://support.google.com/adspolicy/answer/9703665',
    sourceDomain: 'support.google.com/adspolicy',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn chính sách xác minh nhà quảng cáo.',
  },
  AD_POLICY_MISREPRESENTATION: {
    sourceId: 'AD_POLICY_MISREPRESENTATION',
    sourceUrl: 'https://support.google.com/adspolicy/answer/6020955',
    sourceDomain: 'support.google.com/adspolicy',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn chính sách Google Ads về xuyên tạc/misrepresentation.',
  },
  AD_POLICY_DESTINATION: {
    sourceId: 'AD_POLICY_DESTINATION',
    sourceUrl: 'https://support.google.com/adspolicy/answer/6008942',
    sourceDomain: 'support.google.com/adspolicy',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn chính sách Google Ads về destination/final URL.',
  },
  AD_POLICY_PROHIBITED_RESTRICTED: {
    sourceId: 'AD_POLICY_PROHIBITED_RESTRICTED',
    sourceUrl: 'https://support.google.com/adspolicy/topic/1626336',
    sourceDomain: 'support.google.com/adspolicy',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn tổng quan chính sách nội dung bị cấm/hạn chế.',
  },
  GOOGLE_ADS_CONVERSIONS: {
    sourceId: 'GOOGLE_ADS_CONVERSIONS',
    sourceUrl: 'https://support.google.com/google-ads/answer/1722022',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về conversion tracking.',
  },
  GOOGLE_ADS_CAMPAIGN_SETTINGS: {
    sourceId: 'GOOGLE_ADS_CAMPAIGN_SETTINGS',
    sourceUrl: 'https://support.google.com/google-ads/answer/6325025',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về cài đặt chiến dịch.',
  },
  GOOGLE_ADS_BIDDING: {
    sourceId: 'GOOGLE_ADS_BIDDING',
    sourceUrl: 'https://support.google.com/google-ads/answer/2472725',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về chiến lược đặt giá thầu.',
  },
  GOOGLE_ADS_BUDGETS: {
    sourceId: 'GOOGLE_ADS_BUDGETS',
    sourceUrl: 'https://support.google.com/google-ads/answer/2375423',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về ngân sách chiến dịch.',
  },
  GOOGLE_ADS_KEYWORDS: {
    sourceId: 'GOOGLE_ADS_KEYWORDS',
    sourceUrl: 'https://support.google.com/google-ads/answer/7478529',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về keyword và match type.',
  },
  GOOGLE_ADS_AD_ASSETS: {
    sourceId: 'GOOGLE_ADS_AD_ASSETS',
    sourceUrl: 'https://support.google.com/google-ads/answer/2375499',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về ad assets.',
  },
  GOOGLE_ADS_OPTIMIZATION: {
    sourceId: 'GOOGLE_ADS_OPTIMIZATION',
    sourceUrl: 'https://support.google.com/google-ads/answer/3416396',
    sourceDomain: 'support.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn trợ giúp Google Ads về recommendations/optimization score.',
  },
  GOOGLE_ADS_API_CONVERSIONS: {
    sourceId: 'GOOGLE_ADS_API_CONVERSIONS',
    sourceUrl: 'https://developers.google.com/google-ads/api/docs/conversions/overview',
    sourceDomain: 'developers.google.com/google-ads',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'OFFICIAL',
    noteVi: 'Nguồn developer Google Ads về dữ liệu conversion.',
  },
  BUSINESS_GUARDRAIL_INTERNAL: {
    sourceId: 'BUSINESS_GUARDRAIL_INTERNAL',
    sourceUrl: 'internal://noi-that-hung-ngoc/google-ads-guardrails',
    sourceDomain: 'internal',
    sourceCheckedAt: GOOGLE_ADS_RULE_SOURCE_CHECKED_AT,
    sourceType: 'INTERNAL',
    noteVi: 'Quy tắc vận hành nội bộ cho ngân sách nhỏ và follow-up lead.',
  },
};

export function defineGoogleAdsRule(rule: GoogleAdsRuleDefinitionDraft): GoogleAdsRuleDefinition {
  const source = GOOGLE_ADS_RULE_SOURCE_REGISTRY[rule.sourceId];
  if (!source) throw new Error('Unknown Google Ads rule source: ' + rule.sourceId);
  return {
    ...rule,
    sourceUrl: source.sourceUrl,
    sourceDomain: source.sourceDomain,
    sourceCheckedAt: source.sourceCheckedAt,
    sourceType: source.sourceType,
    catalogVersion: GOOGLE_ADS_RULE_CATALOG_VERSION,
    active: rule.active ?? true,
  };
}

import { googleAdsAccountRules } from './googleAdsAccountRules';
import { googleAdsAdCopyRules } from './googleAdsAdCopyRules';
import { googleAdsAssetRules } from './googleAdsAssetRules';
import { googleAdsBiddingRules } from './googleAdsBiddingRules';
import { googleAdsBillingRules } from './googleAdsBillingRules';
import { googleAdsBudgetRules } from './googleAdsBudgetRules';
import { googleAdsCampaignRules } from './googleAdsCampaignRules';
import { googleAdsConversionRules } from './googleAdsConversionRules';
import { googleAdsKeywordRules } from './googleAdsKeywordRules';
import { googleAdsLandingPageRules } from './googleAdsLandingPageRules';
import { googleAdsOptimizationRules } from './googleAdsOptimizationRules';
import { googleAdsPolicyRules } from './googleAdsPolicyRules';
import { googleAdsPrivacyRules } from './googleAdsPrivacyRules';
import { googleAdsStopRules } from './googleAdsStopRules';
import type { GoogleAdsRuleCategory, GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsRuleCatalog: GoogleAdsRuleDefinition[] = [
  ...googleAdsAccountRules,
  ...googleAdsBillingRules,
  ...googleAdsPolicyRules,
  ...googleAdsLandingPageRules,
  ...googleAdsConversionRules,
  ...googleAdsCampaignRules,
  ...googleAdsBiddingRules,
  ...googleAdsBudgetRules,
  ...googleAdsKeywordRules,
  ...googleAdsAdCopyRules,
  ...googleAdsAssetRules,
  ...googleAdsPrivacyRules,
  ...googleAdsOptimizationRules,
  ...googleAdsStopRules,
];

export const googleAdsRuleCatalogByCategory = googleAdsRuleCatalog.reduce((acc, rule) => {
  acc[rule.category] = (acc[rule.category] || 0) + 1;
  return acc;
}, {} as Record<GoogleAdsRuleCategory, number>);

export const googleAdsRuleCatalogStats = {
  total: googleAdsRuleCatalog.length,
  officialPolicy: googleAdsRuleCatalog.filter((rule) => rule.source === 'OFFICIAL_POLICY').length,
  platformRule: googleAdsRuleCatalog.filter((rule) => rule.source === 'PLATFORM_RULE').length,
  businessGuardrail: googleAdsRuleCatalog.filter((rule) => rule.source === 'BUSINESS_GUARDRAIL').length,
  critical: googleAdsRuleCatalog.filter((rule) => rule.severity === 'critical').length,
  stopRules: googleAdsRuleCatalog.filter((rule) => rule.stopRule).length,
  categories: googleAdsRuleCatalogByCategory,
};

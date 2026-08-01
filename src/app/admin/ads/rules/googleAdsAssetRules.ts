import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsAssetRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['asset-sitelink-url-verified', 'Sitelink URL đã xác minh'],
    ['asset-call-extension-number-verified', 'Call asset dùng số điện thoại xác nhận'],
    ['asset-location-evidence', 'Location asset có bằng chứng địa chỉ'],
    ['asset-image-policy-safe', 'Image asset không gây hiểu nhầm/chất lượng kém'],
    ['asset-callout-truthful', 'Callout đúng thực tế'],
    ['asset-price-promotion-evidence', 'Price/promotion asset có bằng chứng'],
    ['asset-no-sensitive-data', 'Asset không chứa dữ liệu nhạy cảm'],
    ['asset-not-required-for-launch', 'Asset thiếu không tự chặn launch nếu campaign Search cơ bản đủ'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('price') || id.includes('truthful') || id.includes('image') ? 'OFFICIAL_POLICY' : 'PLATFORM_RULE',
    sourceId: id.includes('price') || id.includes('truthful') || id.includes('image') ? 'AD_POLICY_MISREPRESENTATION' : 'GOOGLE_ADS_AD_ASSETS',
    category: 'AD_COPY_ASSETS',
    readinessCategory: 'campaign-settings',
    severity: 'medium',
    summaryVi: 'Assets bổ sung chỉ dùng khi có dữ liệu thật, thiếu asset không tạo hard blocker độc lập.',
    canBlockLaunch: false,
    defaultStatus: id.includes('not-required') ? 'not_applicable' : 'unknown',
    missingEvidence: ['Asset evidence'],
    evidenceKeys: ['adGroups.finalUrl', 'notes'],
    recommendedActionVi: 'Chỉ thêm asset có nguồn từ website/Supabase/config đã xác nhận.',
    prohibitedActionVi: 'Không bịa giá, khuyến mãi, địa chỉ hoặc số điện thoại.',
    scoreImpact: 1,
  })),
];

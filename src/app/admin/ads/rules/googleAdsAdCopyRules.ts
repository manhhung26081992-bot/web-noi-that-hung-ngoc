import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

export const googleAdsAdCopyRules: GoogleAdsRuleDefinition[] = [
  ...([
    ['ad-copy-headline-length', 'Headline trong giới hạn ký tự'],
    ['ad-copy-description-length', 'Description trong giới hạn ký tự'],
    ['ad-copy-message-match-keyword-url', 'Ad copy khớp keyword và final URL'],
    ['ad-copy-no-unverified-superlatives', 'Không claim rẻ nhất/số 1/chính hãng nếu chưa xác nhận'],
    ['ad-copy-no-misleading-price', 'Giá/khuyến mãi trong copy có bằng chứng'],
    ['ad-copy-clear-cta', 'CTA rõ: gọi/Zalo/form/tư vấn'],
    ['ad-copy-no-forbidden-punctuation', 'Không dùng dấu câu/ký tự gây lỗi editorial'],
    ['ad-copy-pinning-reviewed', 'Pin headline chỉ khi có lý do'],
    ['ad-copy-local-service-truthful', 'Khu vực phục vụ trong copy đúng thực tế'],
    ['ad-copy-draft-when-blocked', 'Copy chỉ là bản nháp khi canLaunch=false'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: id.includes('unverified') || id.includes('misleading') ? 'OFFICIAL_POLICY' : 'PLATFORM_RULE',
    sourceId: id.includes('unverified') || id.includes('misleading') ? 'AD_POLICY_MISREPRESENTATION' : 'GOOGLE_ADS_AD_ASSETS',
    category: 'AD_COPY_ASSETS',
    readinessCategory: id.includes('draft') ? 'account-policy' : 'campaign-settings',
    severity: id.includes('draft') || id.includes('unverified') || id.includes('misleading') ? 'high' : 'medium',
    summaryVi: 'Ad copy/assets phải đúng policy, đúng giới hạn ký tự và chỉ copy khi engine cho phép launch.',
    canBlockLaunch: id.includes('draft'),
    defaultStatus: 'unknown',
    missingEvidence: ['Ad copy draft', 'Final URL evidence', 'Claim evidence nếu có'],
    evidenceKeys: ['adGroups.headlines', 'adGroups.descriptions', 'readiness.canLaunch'],
    recommendedActionVi: 'Soát headline/description trước khi publish.',
    prohibitedActionVi: 'Không copy nội dung chạy Ads khi canLaunch=false.',
    scoreImpact: id.includes('draft') ? 20 : 2,
  })),
];

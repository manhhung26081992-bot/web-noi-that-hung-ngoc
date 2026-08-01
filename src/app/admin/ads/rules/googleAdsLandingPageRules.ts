import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

const category = 'LANDING_PAGE_DESTINATION' as const;
const readinessCategory = 'landing-page' as const;

export const googleAdsLandingPageRules: GoogleAdsRuleDefinition[] = [
  defineGoogleAdsRule({
    id: 'platform-final-url-landing',
    title: 'Final URL và landing page đã xác nhận',
    source: 'PLATFORM_RULE',
    sourceId: 'AD_POLICY_DESTINATION',
    category,
    readinessCategory,
    severity: 'critical',
    summaryVi: 'Final URL phải mở được, đúng sản phẩm/dịch vụ và có CTA rõ.',
    stopRule: true,
    canBlockLaunch: true,
    unknownBlocksLaunch: true,
    defaultStatus: 'unknown',
    missingEvidence: ['Final URL', 'HTTP/mobile check', 'CTA gọi/Zalo/form'],
    evidenceKeys: ['adGroups.finalUrl', 'adGroups.urlStatus', 'landingWarnings'],
    recommendedActionVi: 'Mở final URL trên mobile, kiểm tra 404, redirect, CTA và nội dung khớp ad.',
    prohibitedActionVi: 'Không sửa slug website trong luồng Ads Planner.',
    scoreImpact: 16,
  }),
  ...([
    ['landing-no-404', 'Không có 404/soft 404'],
    ['landing-no-abnormal-redirect', 'Không redirect bất thường'],
    ['landing-mobile-usable', 'Trang dùng được trên mobile'],
    ['landing-product-message-match', 'Keyword/ad copy khớp nội dung landing'],
    ['landing-contact-visible', 'Số điện thoại/Zalo/form dễ thấy'],
    ['landing-business-info-present', 'Thông tin doanh nghiệp/liên hệ hiện diện'],
    ['landing-speed-evidence', 'Có bằng chứng tốc độ/khả dụng trước launch'],
    ['landing-no-malware-warning', 'Không có cảnh báo malware/compromise'],
    ['landing-policy-consistent-pricing', 'Giá/khuyến mãi trên landing nhất quán'],
    ['landing-no-unverified-domain-switch', 'Không đổi domain/final URL chưa xác minh'],
    ['landing-thank-you-flow-known', 'Luồng thank-you/success page rõ nếu dùng form'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: 'PLATFORM_RULE',
    sourceId: 'AD_POLICY_DESTINATION',
    category,
    readinessCategory,
    severity: id.includes('malware') || id.includes('redirect') || id.includes('404') ? 'critical' : 'medium',
    summaryVi: 'Destination rule: thiếu bằng chứng quan trọng là unknown, lỗi nặng có thể chặn launch.',
    stopRule: id.includes('malware') || id.includes('redirect') || id.includes('404'),
    canBlockLaunch: id.includes('malware') || id.includes('redirect') || id.includes('404'),
    defaultStatus: 'unknown',
    missingEvidence: ['Landing page evidence'],
    evidenceKeys: ['landingWarnings', 'adGroups.finalUrl'],
    recommendedActionVi: 'Kiểm tra thủ công URL đích trước khi copy/publish.',
    prohibitedActionVi: 'Không chạy URL chưa xác nhận hoặc sai sản phẩm.',
    scoreImpact: id.includes('malware') || id.includes('redirect') || id.includes('404') ? 16 : 3,
  })),
];

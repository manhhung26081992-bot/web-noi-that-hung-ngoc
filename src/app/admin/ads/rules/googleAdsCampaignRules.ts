import { defineGoogleAdsRule } from './googleAdsRuleSources';
import type { GoogleAdsRuleDefinition } from './googleAdsRuleTypes';

const category = 'CAMPAIGN_SETTINGS' as const;
const readinessCategory = 'campaign-settings' as const;

export const googleAdsCampaignRules: GoogleAdsRuleDefinition[] = [
  defineGoogleAdsRule({
    id: 'platform-campaign-settings',
    title: 'Campaign settings có bằng chứng kiểm tra',
    source: 'PLATFORM_RULE',
    sourceId: 'GOOGLE_ADS_CAMPAIGN_SETTINGS',
    category,
    readinessCategory,
    severity: 'high',
    summaryVi: 'Cài đặt campaign thiếu bằng chứng tạo warning và giới hạn readiness.',
    canBlockLaunch: false,
    defaultStatus: 'unknown',
    missingEvidence: ['Start/end date', 'Ad schedule', 'Location targeting', 'Network settings', 'Bid/budget'],
    evidenceKeys: ['campaignStatus'],
    recommendedActionVi: 'Dùng Search Network, location đúng khu giao hàng, lịch chạy có người trực.',
    prohibitedActionVi: 'Không tự bật PMax/Display/Recommendation hàng loạt.',
    scoreImpact: 7,
  }),
  ...([
    ['campaign-search-network-only', 'Search Network được ưu tiên cho test nhỏ'],
    ['campaign-search-partners-reviewed', 'Search partners được review trước khi bật'],
    ['campaign-display-network-off', 'Display Network tắt trong test search đầu'],
    ['campaign-location-presence-targeting', 'Location targeting theo presence/khu phục vụ thật'],
    ['campaign-language-reviewed', 'Ngôn ngữ phù hợp khách hàng'],
    ['campaign-ad-schedule-sales-hours', 'Ad schedule khớp giờ có người follow-up'],
    ['campaign-device-review', 'Thiết bị được review theo landing/lead flow'],
    ['campaign-start-end-date-known', 'Start/end date rõ'],
    ['campaign-change-control', 'Không đổi nhiều setting liên tục trong giai đoạn đọc tín hiệu'],
  ] as const
  ).map(([id, title]) => defineGoogleAdsRule({
    id,
    title,
    source: 'PLATFORM_RULE',
    sourceId: 'GOOGLE_ADS_CAMPAIGN_SETTINGS',
    category,
    readinessCategory,
    severity: 'medium',
    summaryVi: 'Campaign settings phải được kiểm tra để tránh ngừng phân phối hoặc lãng phí.',
    canBlockLaunch: false,
    defaultStatus: 'unknown',
    missingEvidence: ['Campaign settings screenshot'],
    evidenceKeys: ['campaignStatus', 'notes'],
    recommendedActionVi: 'Xác nhận thủ công trong Campaign settings.',
    prohibitedActionVi: 'Không tăng ngân sách để sửa lỗi setting.',
    scoreImpact: 2,
  })),
];

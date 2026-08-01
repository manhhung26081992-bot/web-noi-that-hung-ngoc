import { GOOGLE_ADS_RULE_CATALOG_VERSION } from './googleAdsRuleSources';
import { googleAdsRuleCatalog } from './googleAdsRuleCatalog';
import type {
  AdsDiagnosticConfidence,
  AdsReadinessCategory,
  AdsRuleEvaluation,
  AdsRuleStatus,
  GoogleAdsRuleDefinition,
  GoogleAdsRuleEngineInput,
  GoogleAdsRuleEngineResult,
  GoogleAdsRuleReadinessSnapshot,
} from './googleAdsRuleTypes';

const readinessWeights: Record<AdsReadinessCategory, { label: string; maxScore: number }> = {
  'account-policy': { label: 'Tài khoản/chính sách', maxScore: 20 },
  'billing-verification': { label: 'Thanh toán/xác minh', maxScore: 10 },
  'conversion-tracking': { label: 'Đo lường chuyển đổi', maxScore: 20 },
  'landing-page': { label: 'Trang đích', maxScore: 20 },
  'keyword-intent': { label: 'Từ khóa/ý định tìm kiếm', maxScore: 15 },
  'campaign-settings': { label: 'Cài đặt chiến dịch', maxScore: 10 },
  'sales-followup': { label: 'Theo dõi/xử lý khách hàng', maxScore: 5 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesAny(value: unknown, terms: string[]) {
  const text = normalizeText(value);
  return terms.some((term) => text.includes(normalizeText(term)));
}

function isUnknownText(value: unknown) {
  const text = normalizeText(value).trim();
  return !text || ['chua co du lieu', 'khong xac dinh', 'unknown', 'n/a', 'na', 'null', 'undefined'].some((term) => text === term || text.includes(term));
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function evidenceLine(input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  return [
    'Account: ' + String(h.accountStatus || 'Chưa có dữ liệu'),
    'Billing: ' + String(h.billingStatus || 'Chưa có dữ liệu'),
    'Verification: ' + String(h.advertiserVerificationStatus || 'Chưa có dữ liệu'),
    'Policy: ' + String(h.policyStatus || 'Chưa có dữ liệu'),
    'Tracking: ' + String(h.conversionTrackingStatus || 'Chưa có dữ liệu'),
    'Keyword import: ' + String(input.googleAdsKeywordCount ?? 'Chưa có dữ liệu'),
    'Ad groups: ' + input.adGroups.length,
  ].join('. ') + '.';
}

function trackingReady(input: GoogleAdsRuleEngineInput) {
  const value = input.accountHistory.conversionTrackingStatus;
  return includesAny(value, ['da xac nhan', 'dang hoat dong', 'verified', 'active']) && !includesAny(value, ['chua', 'sai', 'loi', 'stopped', 'dung']);
}

function primaryGoalKnown(input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  const text = [h.notes, h.evidenceSource].join(' ');
  return Boolean(h.phoneCalls || h.zaloContacts || h.formSubmissions || h.orders)
    || includesAny(text, ['muc tieu chinh', 'primary goal', 'conversion chinh', 'phone', 'zalo', 'form', 'order', 'don hang']);
}

function landingReady(input: GoogleAdsRuleEngineInput) {
  const hasVerifiedUrl = input.adGroups.some((group) => group.finalUrl && includesAny(group.urlStatus, ['da xac nhan', 'verified']));
  const hasMissingUrlWarning = input.landingWarnings.some((item) => includesAny(item.url + ' ' + item.warning, ['chua co url', '404', 'khong mo duoc', 'unavailable']));
  return hasVerifiedUrl && !hasMissingUrlWarning;
}

function campaignKnown(input: GoogleAdsRuleEngineInput) {
  const status = input.accountHistory.campaignStatus;
  return !isUnknownText(status) && !includesAny(status, ['chi lap ke hoach']);
}

function accountGateReady(input: GoogleAdsRuleEngineInput, evaluations: AdsRuleEvaluation[]) {
  const h = input.accountHistory || {};
  const accountRule = evaluations.find((rule) => rule.id === 'official-account-status');
  return accountRule?.status === 'pass' && !isUnknownText(h.accountStatus) && !isUnknownText(h.evidenceSource);
}

function billingGateReady(input: GoogleAdsRuleEngineInput, evaluations: AdsRuleEvaluation[]) {
  const h = input.accountHistory || {};
  const billingRule = evaluations.find((rule) => rule.id === 'platform-billing');
  const verificationRule = evaluations.find((rule) => rule.id === 'official-advertiser-verification');
  return billingRule?.status === 'pass'
    && verificationRule?.status === 'pass'
    && !isUnknownText(h.billingStatus)
    && !isUnknownText(h.advertiserVerificationStatus);
}

function hasHttpMobileEvidence(input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  return includesAny([h.notes, h.evidenceSource, h.warningMessage].join(' '), ['http', 'https', 'mobile', '404', 'cta', 'final url', 'landing page']);
}

function landingGateReady(input: GoogleAdsRuleEngineInput, evaluations: AdsRuleEvaluation[]) {
  const landingRule = evaluations.find((rule) => rule.id === 'platform-final-url-landing');
  const userConfirmedFinalUrl = input.adGroups.some((group) => group.finalUrl && includesAny(group.urlStatus, ['da xac nhan', 'verified']));
  return landingRule?.status === 'pass' && userConfirmedFinalUrl && hasHttpMobileEvidence(input);
}

function followupGateReady(input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  const hasLeadOrOrderLog = [h.phoneCalls, h.zaloContacts, h.formSubmissions, h.orders].some((value) => numberValue(value) != null);
  const hasReviewEvidence = includesAny([h.notes, h.evidenceSource].join(' '), ['review lead', 'doi chieu lead', 'lead log', 'call log', 'zalo log', 'form log', 'order log', 'sales review']);
  return hasLeadOrOrderLog && hasReviewEvidence;
}

function keywordUserConfirmed(input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  return includesAny([h.notes, h.evidenceSource].join(' '), ['keyword da xac nhan', 'ad group da xac nhan', 'campaign da xac nhan', 'nguoi dung xac nhan keyword', 'nguoi dung xac nhan ad group']);
}

function categoryGate(
  id: AdsReadinessCategory,
  input: GoogleAdsRuleEngineInput,
  evaluations: AdsRuleEvaluation[],
): { open: boolean; cap?: number; evidence: string } {
  switch (id) {
    case 'account-policy':
      return accountGateReady(input, evaluations)
        ? { open: true, evidence: 'Gate mở: account status và nguồn bằng chứng chính thức đã xác nhận.' }
        : { open: false, evidence: 'Gate đóng: chưa xác nhận account status bằng nguồn bằng chứng chính thức; rule phụ không được cộng điểm.' };
    case 'billing-verification':
      return billingGateReady(input, evaluations)
        ? { open: true, evidence: 'Gate mở: billing và advertiser verification đã có bằng chứng.' }
        : { open: false, evidence: 'Gate đóng: billing hoặc advertiser verification chưa có bằng chứng; rule phụ không được cộng điểm.' };
    case 'conversion-tracking':
      return trackingReady(input) && primaryGoalKnown(input)
        ? { open: true, evidence: 'Gate mở: conversion tracking và mục tiêu chuyển đổi chính đã xác nhận.' }
        : { open: false, evidence: 'Gate đóng: conversion tracking hoặc mục tiêu chuyển đổi chính chưa xác nhận; rule phụ không được cộng điểm.' };
    case 'landing-page':
      return landingGateReady(input, evaluations)
        ? { open: true, evidence: 'Gate mở: final URL đã xác nhận và có bằng chứng HTTP/mobile.' }
        : { open: false, evidence: 'Gate đóng: final URL chưa được người dùng xác nhận hoặc chưa có bằng chứng HTTP/mobile; URL do GSC/AI đề xuất không đủ mở gate.' };
    case 'campaign-settings':
      return campaignKnown(input)
        ? { open: true, evidence: 'Gate mở: campaign settings đã có bằng chứng.' }
        : { open: false, evidence: 'Gate đóng: chưa có campaign settings evidence; rule phụ không được cộng điểm.' };
    case 'sales-followup':
      return followupGateReady(input)
        ? { open: true, evidence: 'Gate mở: có lead/order log và bằng chứng review lead.' }
        : { open: false, evidence: 'Gate đóng: chưa có lead/order log và review evidence; rule phụ không được cộng điểm.' };
    case 'keyword-intent':
      if (keywordCount(input) <= 0) return { open: false, evidence: 'Gate đóng: chưa có Ads import/search terms evidence.' };
      return keywordUserConfirmed(input)
        ? { open: true, evidence: 'Gate mở: keyword/ad group đã có bằng chứng xác nhận.' }
        : { open: true, cap: 3, evidence: 'Điểm chuẩn bị dữ liệu từ khóa, chưa chứng minh campaign sẵn sàng chạy.' };
  }
}

function keywordCount(input: GoogleAdsRuleEngineInput) {
  return numberValue(input.googleAdsKeywordCount) ?? 0;
}

function hasSpendCapIssue(input: GoogleAdsRuleEngineInput) {
  const cap = numberValue(input.userDailyBudgetCap ?? input.accountHistory.dailyBudget);
  const spend = numberValue(input.accountHistory.actualSpend ?? input.accountHistory.estimatedSpend);
  return Boolean(cap && spend && spend > cap);
}

function hasSpendCapEvidence(input: GoogleAdsRuleEngineInput) {
  return numberValue(input.userDailyBudgetCap ?? input.accountHistory.dailyBudget) != null
    || numberValue(input.accountHistory.actualSpend ?? input.accountHistory.estimatedSpend) != null;
}

function hasStopRuleEvidence(id: string, input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  switch (id) {
    case 'stop-account-suspension-warning':
      return !isUnknownText(h.accountStatus) || !isUnknownText(h.warningMessage);
    case 'stop-billing-failure':
      return !isUnknownText(h.billingStatus) || !isUnknownText(h.accountStatus);
    case 'stop-verification-required-blocker':
      return !isUnknownText(h.advertiserVerificationStatus) || !isUnknownText(h.accountStatus);
    case 'stop-mass-ad-rejection':
      return !isUnknownText(h.policyStatus) || !isUnknownText(h.warningMessage);
    case 'stop-landing-unavailable':
    case 'stop-abnormal-redirect':
    case 'stop-suspected-compromise-malware':
      return input.landingWarnings.length > 0 || input.adGroups.some((group) => Boolean(group.finalUrl));
    case 'stop-conversion-tracking-stopped':
    case 'stop-duplicate-conversion-spike':
      return !isUnknownText(h.conversionTrackingStatus) || numberValue(h.conversions) != null || !isUnknownText(h.warningMessage);
    case 'stop-abnormal-spend':
    case 'stop-user-spend-cap-reached':
      return hasSpendCapEvidence(input) || !isUnknownText(h.warningMessage);
    case 'stop-severe-irrelevant-search-terms':
      return !isUnknownText(h.warningMessage) || input.googleAdsKeywordCount != null;
    case 'stop-user-requested-stop':
      return !isUnknownText(h.notes) || !isUnknownText(h.warningMessage);
    default:
      return false;
  }
}

function stopRuleTriggered(id: string, input: GoogleAdsRuleEngineInput) {
  const h = input.accountHistory || {};
  const warningText = [h.warningMessage, h.policyStatus, h.accountStatus, h.billingStatus, h.advertiserVerificationStatus, h.conversionTrackingStatus, h.notes].join(' ');
  const landingText = input.landingWarnings.map((item) => [item.url, item.warning, item.source].join(' ')).join(' ');
  switch (id) {
    case 'stop-account-suspension-warning':
      return includesAny(warningText, ['dinh chi', 'suspended', 'cancelled', 'huy']);
    case 'stop-billing-failure':
      return includesAny(warningText, ['loi thanh toan', 'payment failed', 'billing', 'tu choi', 'no']);
    case 'stop-verification-required-blocker':
      return includesAny(warningText, ['cho xac minh', 'can xac minh', 'verification required']);
    case 'stop-mass-ad-rejection':
      return includesAny(warningText, ['hang loat', 'mass', 'multiple disapproved', 'tu choi hang loat']);
    case 'stop-landing-unavailable':
      return includesAny(landingText, ['404', 'unavailable', 'khong mo duoc', 'not found']);
    case 'stop-abnormal-redirect':
      return includesAny(landingText + ' ' + warningText, ['redirect bat thuong', 'abnormal redirect', 'cloaking']);
    case 'stop-suspected-compromise-malware':
      return includesAny(landingText + ' ' + warningText, ['malware', 'compromise', 'bi xam nhap']);
    case 'stop-conversion-tracking-stopped':
      return includesAny(h.conversionTrackingStatus, ['stopped', 'dung', 'ngung', 'khong hoat dong']);
    case 'stop-duplicate-conversion-spike':
      return includesAny(warningText, ['duplicate conversion', 'trung lap conversion', 'spike']);
    case 'stop-abnormal-spend':
      return includesAny(warningText, ['abnormal spend', 'chi tieu bat thuong']) || hasSpendCapIssue(input);
    case 'stop-severe-irrelevant-search-terms':
      return includesAny(warningText, ['search terms lech nang', 'irrelevant search terms']);
    case 'stop-user-spend-cap-reached':
      return hasSpendCapIssue(input);
    case 'stop-user-requested-stop':
      return includesAny(warningText, ['user requested stop', 'yeu cau dung', 'dung ads']);
    default:
      return false;
  }
}

const blockerMessageByRuleId: Record<string, string> = {
  'official-account-status': 'Chưa xác nhận tài khoản đủ điều kiện phân phối',
  'account-access-owner-confirmed': 'Chưa xác nhận quyền truy cập và nguồn bằng chứng tài khoản',
  'account-no-circumvention-risk': 'Có dấu hiệu hoặc chưa loại trừ rủi ro né tránh chính sách',
  'account-no-suspected-compromise': 'Có dấu hiệu hoặc chưa loại trừ rủi ro tài khoản/website bị xâm nhập',
  'account-no-mass-disapproval': 'Có dấu hiệu hoặc chưa loại trừ từ chối quảng cáo hàng loạt',
  'official-policy-warning': 'Chưa xác nhận không còn cảnh báo chính sách hoặc quảng cáo bị từ chối',
  'platform-billing': 'Chưa xác nhận billing/payment không chặn phân phối',
  'official-advertiser-verification': 'Chưa xác nhận advertiser verification không chặn phân phối',
  'billing-no-spend-cap-overrun': 'Chưa xác nhận giới hạn chi tiêu và điều kiện dừng',
  'platform-conversion-tracking': 'Chưa xác nhận conversion tracking',
  'business-primary-goal': 'Chưa xác định mục tiêu chuyển đổi chính',
  'platform-final-url-landing': 'Chưa xác nhận final URL và landing page',
  'platform-keyword-import': 'Chưa có keyword đủ điều kiện từ dữ liệu Google Ads/Keyword Planner',
  'platform-campaign-settings': 'Chưa xác nhận campaign settings có bằng chứng kiểm tra',
  'bidding-strategy-compatible-with-tracking': 'Chưa xác nhận chiến lược giá thầu phù hợp với tracking',
  'bidding-no-maximize-conversions-before-tracking': 'Tracking chưa được xác nhận; chưa được dùng Maximize Conversions',
  'budget-abnormal-spend-stop': 'Chưa thiết lập điều kiện dừng khi chi tiêu bất thường',
  'budget-user-cap-not-exceeded': 'Chưa xác nhận giới hạn chi tiêu và điều kiện dừng',
  'stop-abnormal-spend': 'Chưa thiết lập điều kiện dừng khi chi tiêu bất thường',
  'stop-user-spend-cap-reached': 'Chưa xác nhận giới hạn chi tiêu và điều kiện dừng',
};

function defaultUnknownMessage(rule: GoogleAdsRuleDefinition) {
  return blockerMessageByRuleId[rule.id] || 'Chưa có bằng chứng để xác nhận: ' + rule.title;
}

function defaultBlockerMessage(rule: GoogleAdsRuleDefinition) {
  return blockerMessageByRuleId[rule.id] || (rule.title.startsWith('Không ') ? 'Chưa xác nhận: ' + rule.title.toLowerCase() : 'Chưa đạt điều kiện: ' + rule.title);
}

function messagesForRule(rule: GoogleAdsRuleDefinition) {
  return {
    successMessage: rule.successMessage || 'Đã xác nhận: ' + rule.title,
    blockerMessage: rule.blockerMessage || defaultBlockerMessage(rule),
    unknownMessage: rule.unknownMessage || defaultUnknownMessage(rule),
  };
}

function evaluateKnownRule(rule: GoogleAdsRuleDefinition, input: GoogleAdsRuleEngineInput): { status: AdsRuleStatus; confidence: AdsDiagnosticConfidence; evidence?: string; missingData?: string[] } {
  const h = input.accountHistory || {};
  const accountBlocked = includesAny(h.accountStatus, ['dinh chi', 'huy', 'suspended', 'cancelled']);
  const billingBlocked = includesAny([h.accountStatus, h.billingStatus].join(' '), ['loi thanh toan', 'payment', 'billing', 'tu choi', 'no']);
  const verificationBlocked = includesAny([h.accountStatus, h.advertiserVerificationStatus].join(' '), ['cho xac minh', 'can xac minh', 'verification required']);
  const policyBlocked = includesAny([h.accountStatus, h.policyStatus, h.warningMessage].join(' '), ['chinh sach', 'policy', 'tu choi', 'gioi han', 'disapproved', 'limited']);

  if (rule.stopRule) {
    const triggered = stopRuleTriggered(rule.id, input);
    const hasEvidence = hasStopRuleEvidence(rule.id, input);
    return {
      status: triggered ? 'fail' : hasEvidence ? 'pass' : 'unknown',
      confidence: triggered ? 'Cao' : hasEvidence ? 'Trung bình' : 'Chưa đủ dữ liệu',
      missingData: triggered || hasEvidence ? [] : rule.missingEvidence,
    };
  }

  switch (rule.id) {
    case 'official-account-status':
      return {
        status: accountBlocked ? 'fail' : isUnknownText(h.accountStatus) ? 'unknown' : 'pass',
        confidence: accountBlocked ? 'Cao' : isUnknownText(h.accountStatus) ? 'Chưa đủ dữ liệu' : 'Trung bình',
        missingData: accountBlocked || isUnknownText(h.accountStatus) ? rule.missingEvidence : [],
      };
    case 'platform-billing':
      return {
        status: billingBlocked ? 'fail' : isUnknownText(h.billingStatus) ? 'unknown' : 'pass',
        confidence: billingBlocked ? 'Cao' : isUnknownText(h.billingStatus) ? 'Chưa đủ dữ liệu' : 'Trung bình',
        missingData: billingBlocked || isUnknownText(h.billingStatus) ? rule.missingEvidence : [],
      };
    case 'official-advertiser-verification':
      return {
        status: verificationBlocked ? 'fail' : isUnknownText(h.advertiserVerificationStatus) ? 'unknown' : 'pass',
        confidence: verificationBlocked ? 'Cao' : isUnknownText(h.advertiserVerificationStatus) ? 'Chưa đủ dữ liệu' : 'Trung bình',
        missingData: verificationBlocked || isUnknownText(h.advertiserVerificationStatus) ? rule.missingEvidence : [],
      };
    case 'official-policy-warning':
      return {
        status: policyBlocked ? 'fail' : isUnknownText(h.policyStatus) && isUnknownText(h.warningMessage) ? 'unknown' : 'pass',
        confidence: policyBlocked ? 'Cao' : 'Trung bình',
        missingData: policyBlocked || isUnknownText(h.policyStatus) ? rule.missingEvidence : [],
      };
    case 'platform-conversion-tracking':
      return {
        status: trackingReady(input) ? 'pass' : isUnknownText(h.conversionTrackingStatus) ? 'unknown' : 'fail',
        confidence: trackingReady(input) ? 'Trung bình' : isUnknownText(h.conversionTrackingStatus) ? 'Chưa đủ dữ liệu' : 'Cao',
        missingData: trackingReady(input) ? [] : rule.missingEvidence,
      };
    case 'business-primary-goal':
      return {
        status: primaryGoalKnown(input) ? 'pass' : 'unknown',
        confidence: primaryGoalKnown(input) ? 'Trung bình' : 'Chưa đủ dữ liệu',
        missingData: primaryGoalKnown(input) ? [] : rule.missingEvidence,
      };
    case 'platform-final-url-landing':
      return {
        status: landingReady(input) ? 'pass' : input.adGroups.length ? 'fail' : 'unknown',
        confidence: landingReady(input) ? 'Trung bình' : input.adGroups.length ? 'Cao' : 'Chưa đủ dữ liệu',
        missingData: landingReady(input) ? [] : rule.missingEvidence,
      };
    case 'platform-keyword-import':
      return {
        status: keywordCount(input) > 0 ? 'pass' : input.googleAdsKeywordCount == null ? 'unknown' : 'fail',
        confidence: keywordCount(input) > 0 ? 'Trung bình' : input.googleAdsKeywordCount == null ? 'Chưa đủ dữ liệu' : 'Cao',
        missingData: keywordCount(input) > 0 ? [] : rule.missingEvidence,
      };
    case 'platform-campaign-settings':
      return {
        status: campaignKnown(input) ? 'pass' : 'unknown',
        confidence: campaignKnown(input) ? 'Trung bình' : 'Chưa đủ dữ liệu',
        missingData: campaignKnown(input) ? [] : rule.missingEvidence,
      };
    case 'billing-no-spend-cap-overrun':
    case 'budget-user-cap-not-exceeded':
      return {
        status: hasSpendCapIssue(input) ? 'fail' : hasSpendCapEvidence(input) ? 'pass' : 'unknown',
        confidence: hasSpendCapIssue(input) ? 'Cao' : hasSpendCapEvidence(input) ? 'Trung bình' : 'Chưa đủ dữ liệu',
        missingData: hasSpendCapIssue(input) || hasSpendCapEvidence(input) ? [] : rule.missingEvidence,
      };
    case 'ad-copy-draft-when-blocked':
      return {
        status: 'unknown',
        confidence: 'Chưa đủ dữ liệu',
        missingData: rule.missingEvidence,
      };
    default:
      if (rule.defaultStatus === 'not_applicable') return { status: 'not_applicable', confidence: 'Thấp', missingData: [] };
      return { status: rule.defaultStatus, confidence: rule.defaultStatus === 'unknown' ? 'Chưa đủ dữ liệu' : 'Thấp', missingData: rule.defaultStatus === 'unknown' ? rule.missingEvidence : [] };
  }
}

function toEvaluation(rule: GoogleAdsRuleDefinition, input: GoogleAdsRuleEngineInput, evaluatedAt: string): AdsRuleEvaluation {
  const result = evaluateKnownRule(rule, input);
  const status = rule.active ? result.status : 'not_applicable';
  const messages = messagesForRule(rule);
  const blocksLaunch = rule.active && (status === 'block' || status === 'fail' || (status === 'unknown' && Boolean(rule.unknownBlocksLaunch))) && rule.canBlockLaunch;
  const hardBlocker = blocksLaunch ? status === 'unknown' ? messages.unknownMessage : messages.blockerMessage : null;
  return {
    id: rule.id,
    source: rule.source,
    sourceId: rule.sourceId,
    sourceUrl: rule.sourceUrl,
    sourceDomain: rule.sourceDomain,
    sourceCheckedAt: rule.sourceCheckedAt,
    sourceType: rule.sourceType,
    catalogVersion: rule.catalogVersion,
    category: rule.category,
    readinessCategory: rule.readinessCategory,
    severity: rule.severity,
    title: rule.title,
    summaryVi: rule.summaryVi,
    successMessage: messages.successMessage,
    blockerMessage: messages.blockerMessage,
    unknownMessage: messages.unknownMessage,
    status,
    blocksLaunch,
    hardBlocker,
    criticalViolation: blocksLaunch && rule.severity === 'critical' ? hardBlocker : null,
    evidence: (result.evidence || evidenceLine(input)) + ' EvaluatedAt: ' + evaluatedAt + '.',
    confidence: result.confidence,
    missingData: Array.from(new Set(result.missingData || [])),
    recommendedCheck: rule.recommendedActionVi,
    allowedAction: rule.recommendedActionVi,
    forbiddenAction: rule.prohibitedActionVi,
    recommendedActionVi: rule.recommendedActionVi,
    prohibitedActionVi: rule.prohibitedActionVi,
    scoreImpact: status === 'pass' || status === 'not_applicable' ? 0 : rule.scoreImpact,
  };
}

function buildReadiness(evaluations: AdsRuleEvaluation[], input: GoogleAdsRuleEngineInput): GoogleAdsRuleReadinessSnapshot {
  const categories = Object.entries(readinessWeights).map(([id, meta]) => {
    const gate = categoryGate(id as AdsReadinessCategory, input, evaluations);
    const categoryRules = evaluations.filter((rule) => rule.readinessCategory === id && rule.status !== 'not_applicable');
    const weightedRules = categoryRules.map((rule) => ({
      rule,
      weight: rule.severity === 'critical' ? 4 : rule.severity === 'high' ? 3 : rule.severity === 'medium' ? 2 : 1,
    }));
    const possible = weightedRules.reduce((sum, item) => sum + item.weight, 0);
    const earned = weightedRules.reduce((sum, item) => sum + (item.rule.status === 'pass' ? item.weight : 0), 0);
    const rawScore = possible ? clamp(Math.floor((earned / possible) * meta.maxScore), 0, meta.maxScore) : 0;
    const score = gate.open ? clamp(gate.cap == null ? rawScore : Math.min(rawScore, gate.cap), 0, meta.maxScore) : 0;
    const blocking = categoryRules.find((rule) => rule.blocksLaunch);
    const warning = categoryRules.find((rule) => rule.status === 'warning' || rule.status === 'unknown' || rule.status === 'fail');
    return {
      id: id as AdsReadinessCategory,
      label: meta.label,
      maxScore: meta.maxScore,
      score,
      evidence: gate.open
        ? gate.evidence + ' ' + (blocking?.hardBlocker || (warning?.status === 'unknown' ? warning.unknownMessage : warning?.blockerMessage) || categoryRules.find((rule) => rule.status === 'pass')?.successMessage || 'Không có rule áp dụng.')
        : gate.evidence,
    };
  });
  const hardBlockers = Array.from(new Set(evaluations.filter((rule) => rule.blocksLaunch && rule.hardBlocker).map((rule) => String(rule.hardBlocker))));
  const missingData = Array.from(new Set(evaluations.flatMap((rule) => rule.missingData)));
  const total = categories.reduce((sum, item) => sum + item.score, 0);
  const canLaunch = hardBlockers.length === 0 && total >= 80;
  const classification: GoogleAdsRuleReadinessSnapshot['classification'] = total < 60 ? 'Không chạy Ads' : total < 80 ? 'Chỉ sửa và kiểm tra' : total < 90 ? 'Có thể lập kế hoạch test nhỏ' : 'Đủ điều kiện test có kiểm soát';
  return {
    total,
    classification,
    canLaunch,
    launchMessage: canLaunch ? 'Có thể lập kế hoạch test có kiểm soát.' : 'CHƯA NÊN CHẠY QUẢNG CÁO',
    categories,
    hardBlockers,
    missingData,
    ruleEvaluations: evaluations,
  };
}

export function evaluateGoogleAdsRules(input: GoogleAdsRuleEngineInput): GoogleAdsRuleEngineResult {
  const evaluatedAt = new Date().toISOString();
  const evaluations = googleAdsRuleCatalog.filter((rule) => rule.active).map((rule) => toEvaluation(rule, input, evaluatedAt));
  const readinessScore = buildReadiness(evaluations, input);
  const hardBlockers = readinessScore.hardBlockers;
  const criticalViolations = evaluations.filter((rule) => rule.criticalViolation);
  const warnings = evaluations.filter((rule) => rule.status === 'warning' || rule.status === 'unknown' || rule.status === 'fail');
  const passedRules = evaluations.filter((rule) => rule.status === 'pass');
  const unknownRules = evaluations.filter((rule) => rule.status === 'unknown');
  const notApplicableRules = evaluations.filter((rule) => rule.status === 'not_applicable');
  const missingEvidence = readinessScore.missingData;
  const recommendations = Array.from(new Set(evaluations.filter((rule) => rule.status !== 'pass' && rule.status !== 'not_applicable').map((rule) => rule.recommendedActionVi))).slice(0, 12);
  const nextRequiredAction = hardBlockers[0] ? 'Gỡ blocker: ' + hardBlockers[0] : missingEvidence[0] ? 'Bổ sung bằng chứng: ' + missingEvidence[0] : 'Có thể lập kế hoạch test nhỏ có kiểm soát.';
  const overallStatus = hardBlockers.length || criticalViolations.length ? 'blocked' : unknownRules.some((rule) => rule.severity === 'critical' || rule.severity === 'high') ? 'unknown' : warnings.length ? 'limited' : 'ready';
  return {
    overallStatus,
    readinessScore,
    canLaunch: readinessScore.canLaunch,
    hardBlockers,
    criticalViolations,
    warnings,
    recommendations,
    passedRules,
    unknownRules,
    notApplicableRules,
    missingEvidence,
    nextRequiredAction,
    evaluatedAt,
    ruleCatalogVersion: GOOGLE_ADS_RULE_CATALOG_VERSION,
    evaluations,
  };
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, MetricCard, ModuleCard, SkeletonGrid } from '../seo/components/Ui';
import styles from '../seo/seo-dashboard.module.css';
import {
  ADS_ACCOUNT_STATUS_OPTIONS,
  buildDefaultAdsAccountHistory,
  type AdsAccountHistory,
  type AdsPlannerAdGroup,
  type AdsPlannerKeywordDecision,
  type AdsWizardStepStatus,
  type GoogleAdsAiHistoryItem,
  type GoogleAdsAiPlan,
} from './services/googleAdsPlannerService';

type ApiState = {
  plan: GoogleAdsAiPlan | null;
  history: GoogleAdsAiHistoryItem[];
  accountHistory: AdsAccountHistory;
  sourceSummary: {
    googleAdsKeywordCount: number;
    googleAdsUpdatedAt: string | null;
    savedPlanUpdatedAt: string | null;
    gscQueryPageRows: number;
    gscQueryPageUpdatedAt: string | null;
    gscRanges: GoogleAdsAiPlan['sourceSummary']['gscRanges'];
    hasGoogleAdsImport: boolean;
    hasSearchConsoleData: boolean;
    warnings: string[];
  };
};

const emptyState: ApiState = {
  plan: null,
  history: [],
  accountHistory: buildDefaultAdsAccountHistory(),
  sourceSummary: {
    googleAdsKeywordCount: 0,
    googleAdsUpdatedAt: null,
    savedPlanUpdatedAt: null,
    gscQueryPageRows: 0,
    gscQueryPageUpdatedAt: null,
    gscRanges: [],
    hasGoogleAdsImport: false,
    hasSearchConsoleData: false,
    warnings: [],
  },
};

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBudget(value: number | null | undefined) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ/ngày';
}

function formatNullableNumber(value: number | null | undefined, suffix = '') {
  return value == null ? 'Chưa có dữ liệu' : value.toLocaleString('vi-VN') + suffix;
}

function inputNumberValue(value: number | null | undefined) {
  return value == null ? '' : String(value);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function charBadge(text: string, max: number) {
  return text.length + '/' + max + (text.length > max ? ' vượt' : ' ok');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sourceSummaryFromBody(body: unknown, previous = emptyState.sourceSummary): ApiState['sourceSummary'] {
  const bodyRecord = asRecord(body);
  const summary = asRecord(bodyRecord.sourceSummary || bodyRecord.summary);
  const plan = asRecord(bodyRecord.plan);
  const planSummary = asRecord(plan.sourceSummary);
  return {
    ...previous,
    googleAdsKeywordCount: Number(summary.googleAdsKeywordCount || planSummary.googleAdsKeywordCount || previous.googleAdsKeywordCount || 0),
    googleAdsUpdatedAt: String(summary.googleAdsUpdatedAt || planSummary.googleAdsUpdatedAt || previous.googleAdsUpdatedAt || '') || null,
    savedPlanUpdatedAt: String(summary.savedPlanUpdatedAt || plan.generatedAt || previous.savedPlanUpdatedAt || '') || null,
    gscQueryPageRows: Number(summary.gscQueryPageRows || summary.gscQueryPageCount || planSummary.gscQueryPageRows || previous.gscQueryPageRows || 0),
    gscQueryPageUpdatedAt: String(summary.gscQueryPageUpdatedAt || previous.gscQueryPageUpdatedAt || '') || null,
    gscRanges: Array.isArray(summary.gscRanges) ? summary.gscRanges as GoogleAdsAiPlan['sourceSummary']['gscRanges'] : Array.isArray(planSummary.gscRanges) ? planSummary.gscRanges as GoogleAdsAiPlan['sourceSummary']['gscRanges'] : previous.gscRanges || [],
    hasGoogleAdsImport: Boolean(summary.hasGoogleAdsImport || planSummary.googleAdsKeywordCount || previous.hasGoogleAdsImport),
    hasSearchConsoleData: Boolean(summary.hasSearchConsoleData || summary.gscQueryPageRows || summary.gscQueryPageCount || previous.hasSearchConsoleData),
    warnings: Array.isArray(summary.warnings) ? summary.warnings.map(String) : previous.warnings || [],
  };
}

function KeywordList({ title, items, empty }: { title: string; items: AdsPlannerKeywordDecision[]; empty: string }) {
  return (
    <ModuleCard title={title}>
      <div className={styles.v6List}>
        {items.slice(0, 12).map((item, index) => (
          <article className={styles.v61PlanTask} key={item.id + '-' + index}>
            <div><strong>{item.keyword}</strong><span>{item.score}/100</span></div>
            <p><b>URL:</b> {item.finalUrl || 'Chưa có landing page'}</p>
            <p><b>Nhóm:</b> {item.campaignName} / {item.adGroupName}</p>
            <p>{item.reason}</p>
            <small>{item.source}{item.gscPosition ? ' - GSC position ' + item.gscPosition : ''}{item.risk ? ' - ' + item.risk : ''}</small>
          </article>
        ))}
        {!items.length ? <EmptyState title={empty} /> : null}
      </div>
    </ModuleCard>
  );
}

function AdGroupCard({ group, canLaunch, onCopy }: { group: AdsPlannerAdGroup; canLaunch: boolean; onCopy: (text: string, label: string) => void }) {
  const urlStatus = group.urlStatus || 'Chờ xác nhận URL';
  const budgetStatus = group.budgetStatus || 'Chưa bật - chờ dữ liệu';
  const budgetText = group.dailyBudgetHint || (group.dailyBudgetAmount ? formatBudget(group.dailyBudgetAmount) : 'Chưa bật - chờ dữ liệu');
  const copy = [
    'Campaign: ' + group.campaignName,
    'Ad group: ' + group.adGroupName,
    'Final URL: ' + group.finalUrl,
    'URL status: ' + urlStatus,
    'Budget: ' + budgetText + ' (' + budgetStatus + ')',
    'Exact:',
    ...group.exactKeywords,
    'Phrase:',
    ...group.phraseKeywords,
    'Negative:',
    ...group.negativeKeywords,
  ].join('\n');
  return (
    <article className={styles.adsPlannerAdGroupCard}>
      <div className={styles.adsPlannerAdGroupHeader}>
        <div>
          <strong>{group.campaignName} / {group.adGroupName}</strong>
          <span>{formatNumber(group.keywordCount)} keyword</span>
        </div>
        <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => onCopy(copy, group.adGroupName)}>{canLaunch ? 'Copy ad group' : 'Bản nháp - khóa'}</button>
      </div>
      <div className={styles.adsPlannerGroupMeta}>
        <span><b>Landing page</b>{group.finalUrl}</span>
        <span><b>Trạng thái URL</b>{urlStatus}</span>
        <span><b>Ngân sách</b>{budgetText}</span>
        <span><b>Trạng thái chạy</b>{budgetStatus}</span>
      </div>
      <div className={styles.adsPlannerKeywordColumns}>
        <div><h3>Exact keywords</h3>{group.exactKeywords.slice(0, 20).map((item, index) => <code key={'exact-' + index + '-' + item}>{item}</code>)}</div>
        <div><h3>Phrase keywords</h3>{group.phraseKeywords.slice(0, 20).map((item, index) => <code key={'phrase-' + index + '-' + item}>{item}</code>)}</div>
      </div>
      <p>{group.reason}</p>
      {group.warnings.length ? (
        <details className={styles.adsPlannerDetails}>
          <summary>Xem chi tiết cảnh báo ({group.warnings.length})</summary>
          {group.warnings.map((warning, index) => <p key={'group-warning-' + index + '-' + warning}>{warning}</p>)}
        </details>
      ) : null}
    </article>
  );
}

function DiagnosticList({ title, items }: { title: string; items: GoogleAdsAiPlan['accountPolicyDiagnostics'] }) {
  return (
    <ModuleCard title={title}>
      <div className={styles.adsProDiagnosticList}>
        {items.map((item) => (
          <article className={styles.adsProDiagnosticCard} key={item.id} data-status={item.status}>
            <div><strong>{item.title}</strong><Badge status={item.status === 'blocked' ? 'error' : item.status === 'ok' ? 'ok' : 'pending'}>{item.ruleSource}</Badge></div>
            <p><b>Bằng chứng:</b> {item.evidence}</p>
            <p><b>Rule:</b> {item.ruleId} - {item.confidence}</p>
            <p><b>Cần thiếu:</b> {item.missingData.join(', ')}</p>
            <p><b>Cách kiểm tra:</b> {item.recommendedCheck}</p>
            <p><b>Hành động hợp lệ:</b> {item.allowedAction}</p>
            <p><b>Không được làm:</b> {item.forbiddenAction}</p>
          </article>
        ))}
      </div>
    </ModuleCard>
  );
}

function AccountHistoryForm({
  value,
  saving,
  onChange,
  onSave,
}: {
  value: AdsAccountHistory;
  saving: boolean;
  onChange: (patch: Partial<AdsAccountHistory>) => void;
  onSave: () => void;
}) {
  return (
    <ModuleCard
      title="Trạng thái tài khoản và lịch sử chạy Ads"
      description="Supabase/seo_dashboard_store là nguồn lưu chính; localStorage chỉ dùng làm cache sau khi lưu hoặc dự phòng khi lỗi mạng."
      action={<button className={styles.primaryButton} type="button" onClick={onSave} aria-disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu Supabase'}</button>}
    >
      <div className={styles.adsProFormGrid}>
        <label>Trạng thái tài khoản
          <select value={value.accountStatus} onChange={(event) => onChange({ accountStatus: event.target.value as AdsAccountHistory['accountStatus'] })}>
            {ADS_ACCOUNT_STATUS_OPTIONS.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>Số ngày đã chạy
          <input inputMode="numeric" value={inputNumberValue(value.daysRun)} onChange={(event) => onChange({ daysRun: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Ngân sách cũ/ngày
          <input inputMode="numeric" value={inputNumberValue(value.dailyBudget)} onChange={(event) => onChange({ dailyBudget: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Ước tính tổng ngân sách cũ
          <input inputMode="numeric" value={inputNumberValue(value.estimatedSpend)} onChange={(event) => onChange({ estimatedSpend: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Actual spend
          <input inputMode="numeric" placeholder="Chưa có dữ liệu" value={inputNumberValue(value.actualSpend)} onChange={(event) => onChange({ actualSpend: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Conversions Google Ads
          <input inputMode="numeric" value={inputNumberValue(value.conversions)} onChange={(event) => onChange({ conversions: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Impressions
          <input inputMode="numeric" placeholder="Không bịa số" value={inputNumberValue(value.impressions)} onChange={(event) => onChange({ impressions: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Clicks
          <input inputMode="numeric" placeholder="Không bịa số" value={inputNumberValue(value.clicks)} onChange={(event) => onChange({ clicks: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>CTR
          <input inputMode="decimal" placeholder="%" value={inputNumberValue(value.ctr)} onChange={(event) => onChange({ ctr: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Average CPC
          <input inputMode="numeric" placeholder="Không bịa CPC" value={inputNumberValue(value.averageCpc)} onChange={(event) => onChange({ averageCpc: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Phone calls
          <input inputMode="numeric" placeholder="Chưa có dữ liệu" value={inputNumberValue(value.phoneCalls)} onChange={(event) => onChange({ phoneCalls: parseOptionalNumber(event.target.value) })} />
        </label>
        <label>Zalo contacts
          <input inputMode="numeric" placeholder="Chưa có dữ liệu" value={inputNumberValue(value.zaloContacts)} onChange={(event) => onChange({ zaloContacts: parseOptionalNumber(event.target.value) })} />
        </label>
        <label className={styles.adsProWide}>Dán nguyên văn cảnh báo Google Ads
          <textarea value={value.warningMessage} onChange={(event) => onChange({ warningMessage: event.target.value })} />
        </label>
        <label>Nguồn bằng chứng
          <textarea value={value.evidenceSource} onChange={(event) => onChange({ evidenceSource: event.target.value })} />
        </label>
        <label>Billing status
          <textarea value={value.billingStatus} onChange={(event) => onChange({ billingStatus: event.target.value })} />
        </label>
        <label>Advertiser verification
          <textarea value={value.advertiserVerificationStatus} onChange={(event) => onChange({ advertiserVerificationStatus: event.target.value })} />
        </label>
        <label>Policy status
          <textarea value={value.policyStatus} onChange={(event) => onChange({ policyStatus: event.target.value })} />
        </label>
        <label>Campaign status
          <textarea value={value.campaignStatus} onChange={(event) => onChange({ campaignStatus: event.target.value })} />
        </label>
        <label>Conversion tracking status
          <textarea value={value.conversionTrackingStatus} onChange={(event) => onChange({ conversionTrackingStatus: event.target.value })} />
        </label>
        <label className={styles.adsProWide}>Ghi chú
          <textarea value={value.notes} onChange={(event) => onChange({ notes: event.target.value })} />
        </label>
      </div>
      <p className={styles.adsV8CompactText}>Phân loại dự kiến - cần đối chiếu thông báo chính thức trong tài khoản Google Ads hoặc email.</p>
    </ModuleCard>
  );
}

export default function AdsPlannerClient() {
  const [state, setState] = useState<ApiState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [syncingGsc, setSyncingGsc] = useState(false);
  const [savingAccountHistory, setSavingAccountHistory] = useState(false);
  const [gscRange, setGscRange] = useState('28d');
  const [message, setMessage] = useState('');
  const [accountHistoryDraft, setAccountHistoryDraft] = useState<AdsAccountHistory>(buildDefaultAdsAccountHistory());
  const [wizardStatuses, setWizardStatuses] = useState<Record<string, AdsWizardStepStatus>>({});
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState('ALL');
  const [ruleResultFilter, setRuleResultFilter] = useState('ALL');
  const [ruleSourceFilter, setRuleSourceFilter] = useState('ALL');
  const [ruleSeverityFilter, setRuleSeverityFilter] = useState('ALL');
  const [ruleCatalogExpanded, setRuleCatalogExpanded] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/ads-planner', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || 'Không đọc được Google Ads Planner.');
      setState({
        plan: body.plan || null,
        history: Array.isArray(body.history) ? body.history : [],
        accountHistory: body.accountHistory || body.plan?.accountHistory || buildDefaultAdsAccountHistory(),
        sourceSummary: sourceSummaryFromBody(body),
      });
      setAccountHistoryDraft(body.accountHistory || body.plan?.accountHistory || buildDefaultAdsAccountHistory());
    } catch (error) {
      try {
        const cached = window.localStorage?.getItem('noithathungngoc-google-ads-account-history-v1');
        if (cached) setAccountHistoryDraft(JSON.parse(cached) as AdsAccountHistory);
      } catch {
        // Cache chỉ là dự phòng; lỗi parse không ảnh hưởng Supabase.
      }
      setMessage(error instanceof Error ? error.message : 'Không đọc được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlan(); }, [loadPlan]);

  async function runPlanner() {
    setRunning(true);
    setMessage('Đang chạy AI Google Ads Planner...');
    try {
      const response = await fetch('/api/admin/ads-planner', { method: 'POST', headers: { Accept: 'application/json' }, cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((body.message || body.error || 'API lỗi') + ' (' + response.status + ')');
      setState((prev) => ({
        ...prev,
        plan: body.plan || null,
        history: Array.isArray(body.history) ? body.history : prev.history,
        accountHistory: body.accountHistory || body.plan?.accountHistory || prev.accountHistory,
        sourceSummary: sourceSummaryFromBody(body, prev.sourceSummary),
      }));
      if (body.accountHistory || body.plan?.accountHistory) setAccountHistoryDraft(body.accountHistory || body.plan.accountHistory);
      setMessage('Đã tạo và lưu AI Google Ads Planner vào Supabase.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không chạy được AI Google Ads Planner.');
    } finally {
      setRunning(false);
    }
  }

  async function syncSearchConsoleKeywords() {
    setSyncingGsc(true);
    setMessage('Đang đọc dữ liệu Query+Page đã lưu trong Supabase...');
    try {
      const response = await fetch('/api/admin/ads-planner', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const triedKeys = Array.isArray(body.triedKeys) && body.triedKeys.length ? ' Key đã thử: ' + body.triedKeys.join(', ') : '';
        throw new Error((body.message || body.error || 'Không đọc được Search Console đã lưu') + ' (' + response.status + ').' + triedKeys);
      }

      const nextPlan = body.plan || null;
      const rows = Number(body.sourceSummary?.gscQueryPageRows || body.summary?.gscQueryPageRows || body.summary?.gscQueryPageCount || nextPlan?.sourceSummary?.gscQueryPageRows || 0);
      setState((prev) => ({
        ...prev,
        plan: nextPlan,
        history: Array.isArray(body.history) ? body.history : prev.history,
        accountHistory: body.accountHistory || body.plan?.accountHistory || prev.accountHistory,
        sourceSummary: sourceSummaryFromBody(body, prev.sourceSummary),
      }));
      if (body.accountHistory || body.plan?.accountHistory) setAccountHistoryDraft(body.accountHistory || body.plan.accountHistory);

      if (rows > 0) {
        setMessage('Đã đọc ' + formatNumber(rows) + ' dòng Query+Page đã lưu từ Supabase và cập nhật Ads Planner.');
      } else {
        setMessage('Chưa có dữ liệu Search Console Query+Page đã lưu. Hãy đồng bộ ở /admin/seo trước.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được keyword Search Console đã lưu.');
    } finally {
      setSyncingGsc(false);
    }
  }

  async function saveAccountHistory() {
    const nextHistory = { ...accountHistoryDraft, updatedAt: new Date().toISOString() };
    setSavingAccountHistory(true);
    setMessage('Đang lưu lịch sử/trạng thái tài khoản Ads vào Supabase...');
    try {
      const response = await fetch('/api/admin/ads-planner', {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ accountHistory: nextHistory }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || 'Không lưu được trạng thái tài khoản Ads.');
      const saved = body.accountHistory || nextHistory;
      setAccountHistoryDraft(saved);
      setState((prev) => ({ ...prev, accountHistory: saved, plan: prev.plan ? { ...prev.plan, accountHistory: saved } : prev.plan }));
      window.localStorage?.setItem('noithathungngoc-google-ads-account-history-v1', JSON.stringify(saved));
      setMessage('Đã lưu lịch sử/trạng thái tài khoản Ads vào Supabase.');
    } catch (error) {
      try {
        window.localStorage?.setItem('noithathungngoc-google-ads-account-history-v1', JSON.stringify(nextHistory));
      } catch {
        // Supabase vẫn là nguồn chính; cache lỗi không làm sập giao diện.
      }
      setMessage((error instanceof Error ? error.message : 'Không lưu được trạng thái tài khoản Ads.') + ' Bản nháp chỉ được cache tạm trên trình duyệt.');
    } finally {
      setSavingAccountHistory(false);
    }
  }

  function copyText(text: string, label: string) {
    void navigator.clipboard?.writeText(text || '');
    setMessage('Đã copy: ' + label);
  }

  function copyLaunchText(text: string, label: string, canLaunch: boolean) {
    if (!canLaunch) {
      setMessage('CHƯA NÊN CHẠY QUẢNG CÁO: còn hard blocker, chỉ copy checklist khắc phục.');
      return;
    }
    copyText(text, label);
  }

  function launchCopyLabel(label: string, ready: boolean) {
    return ready ? label : 'Bản nháp - khóa';
  }

  const plan = state.plan;
  const counts = plan?.counts;
  const accountHistory = plan?.accountHistory || state.accountHistory || accountHistoryDraft;
  const accountDiagnostics = Array.isArray(plan?.accountPolicyDiagnostics) ? plan.accountPolicyDiagnostics : [];
  const conversionDiagnostics = Array.isArray(plan?.conversionDiagnostics) ? plan.conversionDiagnostics : [];
  const funnelDiagnostics = Array.isArray(plan?.funnelDiagnostics) ? plan.funnelDiagnostics : [];
  const readiness = plan?.readinessScore || null;
  const ruleEvaluations = Array.isArray(plan?.ruleEvaluations) ? plan.ruleEvaluations : readiness?.ruleEvaluations || [];
  const ruleEngineResult = plan?.ruleEngineResult || null;
  const ruleCategories = useMemo(() => {
    const categories = Array.from(new Set(ruleEvaluations.map((rule) => String(rule.category || rule.readinessCategory)).filter(Boolean)));
    return ['ALL', ...categories.sort()];
  }, [ruleEvaluations]);
  const ruleSeverityOptions = useMemo(() => ['ALL', ...Array.from(new Set(ruleEvaluations.map((rule) => String(rule.severity || '')).filter(Boolean))).sort()], [ruleEvaluations]);
  const sortedRuleEvaluations = useMemo(() => {
    const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusRank: Record<string, number> = { fail: 0, block: 0, unknown: 1, warning: 2, pass: 3, not_applicable: 4 };
    return [...ruleEvaluations].sort((a, b) => {
      const aBlockingUnknown = a.status === 'unknown' && a.blocksLaunch;
      const bBlockingUnknown = b.status === 'unknown' && b.blocksLaunch;
      const aCriticalFail = a.severity === 'critical' && (a.status === 'fail' || a.status === 'block');
      const bCriticalFail = b.severity === 'critical' && (b.status === 'fail' || b.status === 'block');
      if (aCriticalFail !== bCriticalFail) return aCriticalFail ? -1 : 1;
      if (a.blocksLaunch !== b.blocksLaunch) return a.blocksLaunch ? -1 : 1;
      if (aBlockingUnknown !== bBlockingUnknown) return aBlockingUnknown ? -1 : 1;
      const statusDiff = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (statusDiff) return statusDiff;
      const severityDiff = (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9);
      if (severityDiff) return severityDiff;
      return a.id.localeCompare(b.id);
    });
  }, [ruleEvaluations]);
  const filteredRuleEvaluations = useMemo(() => sortedRuleEvaluations.filter((rule) => {
    const categoryOk = ruleCategoryFilter === 'ALL' || String(rule.category || rule.readinessCategory) === ruleCategoryFilter;
    const resultOk = ruleResultFilter === 'ALL'
      || (ruleResultFilter === 'FAIL' && (rule.status === 'fail' || rule.status === 'block'))
      || (ruleResultFilter === 'UNKNOWN' && rule.status === 'unknown')
      || (ruleResultFilter === 'PASS' && rule.status === 'pass')
      || (ruleResultFilter === 'NOT_APPLICABLE' && rule.status === 'not_applicable');
    const sourceOk = ruleSourceFilter === 'ALL'
      || (ruleSourceFilter === 'OFFICIAL' && rule.source === 'OFFICIAL_POLICY')
      || (ruleSourceFilter === 'PLATFORM' && rule.source === 'PLATFORM_RULE')
      || (ruleSourceFilter === 'BUSINESS' && rule.source === 'BUSINESS_GUARDRAIL');
    const severityOk = ruleSeverityFilter === 'ALL' || rule.severity === ruleSeverityFilter;
    return categoryOk && resultOk && sourceOk && severityOk;
  }), [ruleCategoryFilter, ruleResultFilter, ruleSeverityFilter, ruleSourceFilter, sortedRuleEvaluations]);
  const visibleRuleEvaluations = useMemo(() => filteredRuleEvaluations.slice(0, ruleCatalogExpanded ? 60 : 20), [filteredRuleEvaluations, ruleCatalogExpanded]);
  const ruleStatusCounts = useMemo(() => {
    const counts = {
      total: ruleEvaluations.length,
      official: ruleEvaluations.filter((rule) => rule.source === 'OFFICIAL_POLICY').length,
      platform: ruleEvaluations.filter((rule) => rule.source === 'PLATFORM_RULE').length,
      business: ruleEvaluations.filter((rule) => rule.source === 'BUSINESS_GUARDRAIL').length,
      pass: ruleEvaluations.filter((rule) => rule.status === 'pass').length,
      fail: ruleEvaluations.filter((rule) => rule.status === 'fail' || rule.status === 'block').length,
      warning: ruleEvaluations.filter((rule) => rule.status === 'warning').length,
      unknown: ruleEngineResult?.unknownRules?.length ?? ruleEvaluations.filter((rule) => rule.status === 'unknown').length,
      notApplicable: ruleEngineResult?.notApplicableRules?.length ?? ruleEvaluations.filter((rule) => rule.status === 'not_applicable').length,
      critical: ruleEngineResult?.criticalViolations?.length ?? ruleEvaluations.filter((rule) => rule.severity === 'critical' && rule.blocksLaunch).length,
      hardBlockers: ruleEngineResult?.hardBlockers?.length ?? readiness?.hardBlockers.length ?? 0,
    };
    return counts;
  }, [readiness?.hardBlockers.length, ruleEngineResult, ruleEvaluations]);
  const wizardSteps = (Array.isArray(plan?.launchWizard) ? plan.launchWizard : []).map((step) => ({ ...step, status: wizardStatuses[step.id] || step.status }));
  const searchGuide = plan?.searchCampaignGuide || null;
  const assetChecklist = Array.isArray(plan?.assetChecklist) ? plan.assetChecklist : [];
  const remediationPlan = Array.isArray(plan?.remediationPlan) ? plan.remediationPlan : [];
  const conditionalTestPlan = Array.isArray(plan?.conditionalTestPlan) ? plan.conditionalTestPlan : [];
  const missingManualData = Array.isArray(plan?.missingManualData) ? plan.missingManualData : readiness?.missingData || [];
  const canLaunch = Boolean(readiness?.canLaunch);
  const gscRowsForUi = state.sourceSummary.gscQueryPageRows || plan?.sourceSummary.gscQueryPageRows || 0;
  const googleAdsCountForUi = state.sourceSummary.googleAdsKeywordCount || plan?.sourceSummary.googleAdsKeywordCount || 0;
  const gscUpdatedAtForUi = state.sourceSummary.gscQueryPageUpdatedAt || plan?.sourceSummary.gscRanges.find((item) => item.updatedAt)?.updatedAt || null;
  const sourceRows = useMemo(() => (state.sourceSummary.gscRanges.length ? state.sourceSummary.gscRanges : plan?.sourceSummary.gscRanges || []).filter((item) => item.rowCount > 0), [plan, state.sourceSummary.gscRanges]);
  const warningsForUi = state.sourceSummary.warnings || [];
  const actionPlanToday = Array.isArray(plan?.actionPlanToday) ? plan.actionPlanToday : [];
  const campaignPlan = Array.isArray(plan?.campaignPlan) ? plan.campaignPlan : [];
  const budgetSuggestion = plan?.budgetSuggestion || null;
  const matchTypeKeywords = Array.isArray(plan?.matchTypeKeywords) ? plan.matchTypeKeywords : [];
  const adCopies = Array.isArray(plan?.adCopies) ? plan.adCopies : [];
  const followUpChecklist = Array.isArray(plan?.followUpChecklist) ? plan.followUpChecklist : [];
  const copyBlocks = (plan?.copyBlocks || {}) as Partial<GoogleAdsAiPlan['copyBlocks']>;
  const actionPlanCopy = copyBlocks.actionPlanToday || actionPlanToday.map((task, index) => String(index + 1) + '. ' + task.title + '\nURL: ' + (task.finalUrl || '-') + '\nKeyword: ' + task.keywords.join(', ') + '\nLý do: ' + task.reason + '\n' + task.copyTask).join('\n\n');
  const matchTypeCopy = copyBlocks.matchTypeKeywords || matchTypeKeywords.map((block) => block.copyText).join('\n\n');
  const followUpCopy = copyBlocks.followUpChecklist || followUpChecklist.join('\n');
  const highIntentKeywordTitle = canLaunch ? 'Từ khóa có ý định mua cao' : 'Từ khóa có ý định mua cao (bản nháp)';

  if (loading) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.hero}>
          <h1>Google Ads Planner</h1>
          <p>Đang tải kế hoạch đã lưu...</p>
        </header>
        <SkeletonGrid />
      </main>
    );
  }

  return (
    <main className={styles.dashboard} data-admin-ads="true">
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Nội Thất Hùng Ngọc</p>
          <h1>Phân loại {formatNumber(googleAdsCountForUi)} từ khóa Google Ads/Keyword Planner</h1>
          <p>Đây là phân loại từ khóa, không phải kết luận tài khoản đã đủ điều kiện chạy quảng cáo.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.secondaryButton} href="/admin/seo" prefetch={false}>Về SEO Dashboard</Link>
          <select className={styles.secondaryButton} value={gscRange} onChange={(event) => setGscRange(event.target.value)} aria-label="Mốc dữ liệu Search Console">
            <option value="7d">7 ngày</option>
            <option value="28d">28 ngày</option>
            <option value="3m">3 tháng</option>
            <option value="6m">6 tháng</option>
            <option value="12m">12 tháng</option>
          </select>
          <button className={styles.secondaryButton} type="button" onClick={syncSearchConsoleKeywords} aria-disabled={syncingGsc || running}>{syncingGsc ? 'Đang lấy GSC...' : 'Lấy keyword từ Search Console'}</button>
          <button className={styles.primaryButton} type="button" onClick={runPlanner} aria-disabled={running || syncingGsc}>{running ? 'Đang chạy...' : 'Chạy AI Google Ads Planner'}</button>
        </div>
      </header>

      {message ? <div className={styles.alert}>{message}</div> : null}
      {warningsForUi.length ? <div className={styles.v61PlanAlerts}>{warningsForUi.slice(0, 4).map((warning, index) => <span key={'warning-' + index + '-' + warning}>{warning}</span>)}</div> : null}

      <AccountHistoryForm
        value={accountHistoryDraft}
        saving={savingAccountHistory}
        onChange={(patch) => setAccountHistoryDraft((prev) => ({ ...prev, ...patch }))}
        onSave={saveAccountHistory}
      />

      <section className={styles.metricGrid}>
        <MetricCard label="Chế độ Ads hiện tại" value="Chỉ lập kế hoạch" hint="Chưa chạy" />
        <MetricCard label="Ngân sách cũ/ngày" value={formatNullableNumber(accountHistory.dailyBudget, 'đ')} hint="Không dùng làm mặc định mới" />
        <MetricCard label="Google Ads conversions" value={formatNullableNumber(accountHistory.conversions)} hint="Chưa đủ bằng chứng về lead thật" />
        <MetricCard label="Readiness Score" value={readiness ? readiness.total + '/100' : 'Chưa tạo plan'} hint={readiness?.classification || 'Chạy AI Planner để tính đủ'} />
      </section>

      {readiness ? (
        <ModuleCard
          title="Readiness Score và hard blockers"
          description="Thiếu dữ liệu không được coi là đạt. Khi còn blocker, chỉ làm checklist khắc phục."
          action={<Badge status={readiness.canLaunch ? 'ok' : 'error'}>{readiness.launchMessage}</Badge>}
        >
          <div className={styles.adsProScoreGrid}>
            {readiness.categories.map((item) => (
              <div key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.score}/{item.maxScore}</span>
                <small>{item.evidence}</small>
              </div>
            ))}
          </div>
          {readiness.hardBlockers.length ? <div className={styles.adsProBlockerBox}><strong>CHƯA NÊN CHẠY QUẢNG CÁO</strong>{readiness.hardBlockers.map((item, index) => <span key={'hard-blocker-' + index + '-' + item}>{item}</span>)}</div> : null}
        </ModuleCard>
      ) : null}

      {ruleEvaluations.length ? (
        <ModuleCard title="Bộ luật Google Ads" description="Nguồn kết luận chính cho canLaunch, hard blockers, diagnostic và wizard.">
          <div className={styles.adsProRuleToolbar}>
            <div className={styles.adsProRuleSummary}>
              <span>Total {ruleStatusCounts.total}</span>
              <span>OFFICIAL_POLICY {ruleStatusCounts.official}</span>
              <span>PLATFORM_RULE {ruleStatusCounts.platform}</span>
              <span>BUSINESS_GUARDRAIL {ruleStatusCounts.business}</span>
              <span>Pass {ruleStatusCounts.pass}</span>
              <span>Fail/block {ruleStatusCounts.fail}</span>
              <span>Warning {ruleStatusCounts.warning}</span>
              <span>Unknown {ruleStatusCounts.unknown}</span>
              <span>Not applicable {ruleStatusCounts.notApplicable}</span>
              <span>Critical {ruleStatusCounts.critical}</span>
              <span>Hard blockers {ruleStatusCounts.hardBlockers}</span>
              {ruleEngineResult ? <span>Catalog {ruleEngineResult.ruleCatalogVersion}</span> : null}
            </div>
            <select className={styles.secondaryButton} value={ruleCategoryFilter} onChange={(event) => setRuleCategoryFilter(event.target.value)} aria-label="Lọc rule theo category">
              {ruleCategories.map((category) => <option key={category} value={category}>{category === 'ALL' ? 'Tất cả category' : category}</option>)}
            </select>
            <select className={styles.secondaryButton} value={ruleResultFilter} onChange={(event) => setRuleResultFilter(event.target.value)} aria-label="Lọc rule theo kết quả">
              <option value="ALL">Tất cả kết quả</option>
              <option value="FAIL">Fail/block</option>
              <option value="UNKNOWN">Unknown</option>
              <option value="PASS">Pass</option>
              <option value="NOT_APPLICABLE">Not applicable</option>
            </select>
            <select className={styles.secondaryButton} value={ruleSourceFilter} onChange={(event) => setRuleSourceFilter(event.target.value)} aria-label="Lọc rule theo loại">
              <option value="ALL">Tất cả loại</option>
              <option value="OFFICIAL">Official</option>
              <option value="PLATFORM">Platform</option>
              <option value="BUSINESS">Business</option>
            </select>
            <select className={styles.secondaryButton} value={ruleSeverityFilter} onChange={(event) => setRuleSeverityFilter(event.target.value)} aria-label="Lọc rule theo severity">
              {ruleSeverityOptions.map((severity) => <option key={severity} value={severity}>{severity === 'ALL' ? 'Tất cả severity' : severity}</option>)}
            </select>
          </div>
          <p className={styles.adsProRuleLimit}>Đang hiển thị {visibleRuleEvaluations.length}/{filteredRuleEvaluations.length} rule sau khi lọc. Mặc định ưu tiên critical fail, hard blocker và unknown quan trọng.</p>
          <div className={styles.adsProRuleGrid}>
            {visibleRuleEvaluations.map((rule) => (
              <article key={rule.id} data-status={rule.status}>
                <div><strong>{rule.title}</strong><Badge status={rule.blocksLaunch || rule.status === 'fail' || rule.status === 'block' ? 'error' : rule.status === 'pass' ? 'ok' : 'pending'}>{rule.source}</Badge></div>
                <p><b>Rule:</b> {rule.id}</p>
                <p><b>Category:</b> {rule.category || rule.readinessCategory}</p>
                <p><b>Nhóm điểm:</b> {rule.readinessCategory}</p>
                <p><b>Kết quả:</b> {rule.status}{rule.blocksLaunch ? ' - khóa chạy Ads' : ''}</p>
                <p><b>Severity:</b> {rule.severity || 'n/a'}</p>
                <p><b>Nguồn:</b> {rule.sourceId || rule.source} {rule.sourceDomain ? '(' + rule.sourceDomain + ')' : ''}</p>
                {rule.sourceUrl ? <p><b>Official URL:</b> <a href={rule.sourceUrl} target="_blank" rel="noreferrer">{rule.sourceUrl}</a></p> : null}
                <p><b>Checked/catalog:</b> {rule.sourceCheckedAt || 'n/a'} / {rule.catalogVersion || ruleEngineResult?.ruleCatalogVersion || 'n/a'}</p>
                {rule.summaryVi ? <p><b>Tóm tắt:</b> {rule.summaryVi}</p> : null}
                <p><b>Bằng chứng:</b> {rule.evidence}</p>
                {rule.missingData?.length ? <p><b>Thiếu:</b> {rule.missingData.join(', ')}</p> : null}
                <p><b>Pass:</b> {rule.successMessage}</p>
                <p><b>Unknown:</b> {rule.unknownMessage}</p>
                <p><b>Blocker:</b> {rule.blockerMessage}</p>
                <p><b>Nên làm:</b> {rule.recommendedActionVi || rule.allowedAction}</p>
                <p><b>Không làm:</b> {rule.prohibitedActionVi || rule.forbiddenAction}</p>
                {rule.hardBlocker ? <p><b>Hard blocker:</b> {rule.hardBlocker}</p> : null}
              </article>
            ))}
          </div>
          {filteredRuleEvaluations.length > 20 ? <button className={styles.secondaryButton} type="button" onClick={() => setRuleCatalogExpanded((value) => !value)}>{ruleCatalogExpanded ? 'Thu gọn' : 'Xem thêm'}</button> : null}
        </ModuleCard>
      ) : null}
      {accountDiagnostics.length || conversionDiagnostics.length ? (
        <section className={styles.gridTwo}>
          <DiagnosticList title="Account/Policy Diagnostic" items={accountDiagnostics} />
          <DiagnosticList title="Conversion Diagnostic" items={conversionDiagnostics} />
        </section>
      ) : null}

      {funnelDiagnostics.length ? (
        <ModuleCard title="Chẩn đoán 0 chuyển đổi theo phễu" description="Impression -> Click -> Landing page -> Tương tác -> Cuộc gọi/Zalo/Form -> Đơn hàng">
          <div className={styles.adsProFunnelGrid}>
            {funnelDiagnostics.map((item) => (
              <article key={item.id}>
                <strong>{item.stage}</strong>
                <p>{item.possibleCause}</p>
                <small><b>Bằng chứng:</b> {item.evidence}</small>
                <small><b>Cần thiếu:</b> {item.missingData.join(', ')}</small>
                <span>{item.priority} - {item.confidence}</span>
              </article>
            ))}
          </div>
        </ModuleCard>
      ) : null}

      {missingManualData.length ? (
        <ModuleCard title="Dữ liệu cần nhập tay" description="Các mục này cần bằng chứng thật trước khi kết luận tài khoản, tracking hoặc hiệu quả chiến dịch.">
          <div className={styles.v6List}>{missingManualData.map((item, index) => <article className={styles.v61PlanMiniTask} key={'missing-' + index + '-' + item}><span>{item}</span></article>)}</div>
        </ModuleCard>
      ) : null}

      <section className={styles.metricGrid}>
        <MetricCard label="Keyword Planner đã import" value={formatNumber(googleAdsCountForUi)} hint={formatDate(plan?.sourceSummary.googleAdsUpdatedAt || state.sourceSummary.googleAdsUpdatedAt)} />
        <MetricCard label="Search Console Query+Page" value={formatNumber(gscRowsForUi)} hint={formatDate(gscUpdatedAtForUi)} />
        <MetricCard label="từ khóa có ý định mua cao" value={formatNumber(counts?.runNow)} />
        <MetricCard label="từ khóa cần thử nghiệm hoặc lọc thêm" value={formatNumber(counts?.testSmallBudget)} />
        <MetricCard label="từ khóa ưu tiên làm SEO trước" value={formatNumber(counts?.seoFirst)} />
        <MetricCard label="từ khóa không phù hợp chạy Ads" value={formatNumber(counts?.doNotRun)} />
        <MetricCard label="negative keyword đề xuất" value={formatNumber(counts?.negativeKeywords)} />
        <MetricCard label="ad group đề xuất" value={formatNumber(counts?.adGroups)} />
        <MetricCard label="Plan cập nhật" value={formatDate(plan?.generatedAt || state.sourceSummary.savedPlanUpdatedAt)} />
      </section>

      <ModuleCard
        title="Dữ liệu AI đang dùng"
        description="Trang chỉ hiển thị summary, không render bảng 4.427 keyword hoặc Query+Page lớn."
        action={plan ? <Badge status="connected">Đã có plan</Badge> : <Badge status="pending">Chưa chạy</Badge>}
      >
        <div className={styles.v61PlanSource}>
          <span>Google Ads import: {formatNumber(googleAdsCountForUi)} keyword</span>
          <span>Search Console Query+Page: {formatNumber(gscRowsForUi)} dòng dùng để đối chiếu keyword/URL</span>
          <span>Products/blog_posts: {formatNumber(plan?.sourceSummary.products || 0)} / {formatNumber(plan?.sourceSummary.blogPosts || 0)}</span>
          <span>Keyword map: {formatNumber(plan?.sourceSummary.keywordMap || 0)} mục</span>
          <span>Nhật ký SEO v11: {formatNumber(plan?.sourceSummary.workLogs || 0)} log</span>
          <span>Range GSC có dữ liệu: {sourceRows.length ? sourceRows.map((item) => item.rangeKey + ' (' + formatNumber(item.rowCount) + ')').join(', ') : 'chưa có'}</span>
        </div>
        {plan?.sourceSummary.notes.length ? <div className={styles.v61PlanAlerts}>{plan.sourceSummary.notes.map((note, index) => <span key={'source-note-' + index + '-' + note}>{note}</span>)}</div> : null}
      </ModuleCard>

      {!plan ? <EmptyState title="Chưa có kế hoạch Google Ads AI" detail="Bấm nút Chạy AI Google Ads Planner để phân tích dữ liệu đã import và lưu Supabase." /> : null}

      {plan ? (
        <>
          <section className={styles.gridTwo}>
            <ModuleCard title="Kế hoạch khắc phục" description="Chỉ làm các việc này khi còn hard blocker.">
              <div className={styles.v6List}>
                {remediationPlan.map((item, index) => <article className={styles.v61PlanMiniTask} key={'remediation-' + index + '-' + item}><span>{item}</span></article>)}
              </div>
            </ModuleCard>
            <ModuleCard title="Kế hoạch test có điều kiện" description="Chỉ mở khi readiness không còn blocker.">
              <div className={styles.v6List}>
                {conditionalTestPlan.map((item, index) => <article className={styles.v61PlanMiniTask} key={'conditional-' + index + '-' + item}><span>{item}</span></article>)}
              </div>
            </ModuleCard>
          </section>

          {searchGuide ? (
            <ModuleCard title="Hướng dẫn Campaign Search" description={searchGuide.defaultMode}>
              <div className={styles.adsProGuideGrid}>
                <div><h3>Cấu trúc</h3>{searchGuide.structure.map((item, index) => <p key={'structure-' + index + '-' + item}>{item}</p>)}</div>
                <div><h3>Network</h3>{searchGuide.network.map((item, index) => <p key={'network-' + index + '-' + item}>{item}</p>)}</div>
                <div><h3>Targeting</h3>{searchGuide.targeting.map((item, index) => <p key={'targeting-' + index + '-' + item}>{item}</p>)}</div>
                <div><h3>Keyword</h3>{searchGuide.keywordRules.map((item, index) => <p key={'keyword-rule-' + index + '-' + item}>{item}</p>)}</div>
              </div>
              <div className={styles.adsProBiddingGrid}>
                {searchGuide.bidding.map((item) => (
                  <article key={item.strategy}>
                    <strong>{item.strategy}</strong>
                    <p>{item.explanation}</p>
                    <small>{item.whenToUse}</small>
                    <span>{item.warning}</span>
                  </article>
                ))}
              </div>
            </ModuleCard>
          ) : null}

          <ModuleCard title="Assets cần kiểm tra">
            <div className={styles.adsProAssetGrid}>
              {assetChecklist.map((item) => (
                <article key={item.asset}>
                  <strong>{item.asset}</strong>
                  <p>{item.instruction}</p>
                  <small>{item.evidenceNeeded}</small>
                  <Badge status="pending">{item.status}</Badge>
                </article>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard title="Wizard hướng dẫn chạy Ads thật" description="AI không tự đánh dấu Đã xác nhận; nút Đã làm chỉ chuyển bước sang trạng thái cần bằng chứng.">
            <div className={styles.adsProWizardGrid}>
              {wizardSteps.map((step) => (
                <article key={step.id}>
                  <div><strong>{step.index}. {step.vietnameseName} ({step.englishTerm})</strong><Badge status={step.status === 'đã xác nhận' ? 'ok' : step.status === 'cần bằng chứng' ? 'warning' : 'pending'}>{step.status}</Badge></div>
                  <p><b>Mục tiêu:</b> {step.goal}</p>
                  <p><b>Menu dự kiến:</b> {step.googleAdsLocation}</p>
                  <p><b>Nên chọn:</b> {step.shouldChoose}</p>
                  <p><b>Không nên:</b> {step.shouldAvoid}</p>
                  <p><b>Lý do:</b> {step.reason}</p>
                  <p><b>Dữ liệu cần nhập:</b> {step.requiredInput.join(', ')}</p>
                  <p><b>Cảnh báo:</b> {step.warning}</p>
                  <p><b>Hoàn thành khi:</b> {step.completionCriteria}</p>
                  <div className={styles.adsProWizardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => setWizardStatuses((prev) => ({ ...prev, [step.id]: 'cần bằng chứng' }))}>Đã làm</button>
                    <button className={styles.secondaryButton} type="button" onClick={() => setMessage(step.vietnameseName + ': ' + step.reason + ' Dữ liệu cần nhập: ' + step.requiredInput.join(', '))}>Chưa rõ - giải thích</button>
                    <button className={styles.secondaryButton} type="button" onClick={() => setWizardStatuses((prev) => ({ ...prev, [step.id]: 'cần bằng chứng' }))}>Có lỗi</button>
                  </div>
                </article>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard
            title="AI Kế hoạch chạy Ads hôm nay"
            description="5-10 việc cụ thể để triển khai Google Ads bằng dữ liệu Keyword Planner, GSC đã lưu và URL SEO hiện có."
            action={<button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(actionPlanCopy, 'kế hoạch Ads hôm nay', canLaunch)}>{launchCopyLabel('Copy kế hoạch hôm nay', canLaunch)}</button>}
          >
            <div className={styles.v6List}>
              {actionPlanToday.slice(0, 10).map((task) => (
                <article className={styles.v61PlanTask} key={task.id}>
                  <div><strong>{task.title}</strong><span>{task.priority}</span></div>
                  <p><b>URL:</b> {task.finalUrl || 'Không áp dụng'}</p>
                  <p><b>Keyword:</b> {task.keywords.slice(0, 8).join(', ') || 'Không áp dụng'}</p>
                  <p>{task.reason}</p>
                  <small>Thời gian ước tính: {task.estimatedTime}</small>
                  <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(task.copyTask, task.title, canLaunch)}>{launchCopyLabel('Copy việc cho Codex', canLaunch)}</button>
                </article>
              ))}
              {!actionPlanToday.length ? <EmptyState title="Chưa có kế hoạch hôm nay" detail="Bấm Chạy AI Google Ads Planner để tạo kế hoạch cụ thể." /> : null}
            </div>
          </ModuleCard>

          <section className={styles.gridTwo}>
            <ModuleCard title="Ngân sách đề xuất" description="Nếu tổng ngân sách khoảng 120.000đ/ngày, chỉ chọn 1-2 nhóm tốt nhất.">
              {budgetSuggestion ? (
                <div className={styles.v61PlanSource}>
                  <span>{budgetSuggestion.highPriorityBudget}</span>
                  <span>{budgetSuggestion.testBudget}</span>
                  <span>{budgetSuggestion.totalDailyBudgetHint}</span>
                  <span>{budgetSuggestion.recommendation}</span>
                  {budgetSuggestion.groupBudgets.slice(0, 8).map((item, index) => <span key={'budget-' + index + '-' + item.campaignName + item.adGroupName + item.finalUrl}>{item.campaignName} / {item.adGroupName}: {item.dailyBudgetHint} - {item.budgetStatus || 'Chưa bật'} - {item.reason}</span>)}
                </div>
              ) : <EmptyState title="Chưa có gợi ý ngân sách" />}
            </ModuleCard>
            <ModuleCard title="Theo dõi sau khi chạy" action={<button className={styles.secondaryButton} type="button" onClick={() => copyText(followUpCopy, 'checklist theo dõi Ads')}>Copy checklist</button>}>
              <div className={styles.v6List}>
                {followUpChecklist.map((item, index) => <article className={styles.v61PlanMiniTask} key={'follow-up-' + index + '-' + item}><span>{item}</span></article>)}
                {!followUpChecklist.length ? <EmptyState title="Chưa có checklist theo dõi" /> : null}
              </div>
            </ModuleCard>
          </section>

          <ModuleCard title="Campaign đề xuất" action={<button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(copyBlocks.campaignStructure || '', 'campaign structure', canLaunch)}>{launchCopyLabel('Copy campaign structure', canLaunch)}</button>}>
            <div className={styles.v6List}>
              {campaignPlan.map((campaign, campaignIndex) => (
                <article className={styles.v61PlanTask} key={'campaign-' + campaignIndex + '-' + campaign.campaignName}>
                  <div><strong>{campaign.campaignName}</strong><span>{campaign.adGroups.length} ad group</span></div>
                  <p>{campaign.reason}</p>
                  <small>{campaign.budgetHint}</small>
                  <div className={styles.adsPlannerCampaignTable}>
                    {campaign.adGroups.slice(0, 6).map((group, groupIndex) => (
                      <div key={'campaign-group-' + campaignIndex + '-' + groupIndex + '-' + group.adGroupName + group.finalUrl}>
                        <strong>{group.adGroupName}</strong>
                        <span>{group.finalUrl}</span>
                        <span>{group.urlStatus || 'Chờ xác nhận URL'}</span>
                        <span>{group.dailyBudgetHint || 'Chưa bật - chờ dữ liệu'}</span>
                        <span>Exact: {group.exactKeywords.slice(0, 4).join(', ')}</span>
                        <span>Phrase: {group.phraseKeywords.slice(0, 4).join(', ')}</span>
                        {group.riskWarnings.length ? <details><summary>Cảnh báo ({group.riskWarnings.length})</summary>{group.riskWarnings.map((warning, warningIndex) => <p key={'risk-' + campaignIndex + '-' + groupIndex + '-' + warningIndex + '-' + warning}>{warning}</p>)}</details> : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!campaignPlan.length ? <EmptyState title="Chưa có campaign đề xuất" /> : null}
            </div>
          </ModuleCard>

          <section className={styles.gridTwo}>
            <KeywordList title={highIntentKeywordTitle} items={plan.runNow} empty="Chưa có keyword đủ điều kiện trong nhóm ý định mua cao." />
            <KeywordList title="Từ khóa cần thử nghiệm hoặc lọc thêm" items={plan.testSmallBudget} empty="Chưa có keyword cần test nhỏ." />
          </section>

          <section className={styles.gridTwo}>
            <KeywordList title="Từ khóa ưu tiên làm SEO trước" items={plan.seoFirst} empty="Chưa có keyword ưu tiên SEO." />
            <KeywordList title="Từ khóa không phù hợp chạy Ads" items={plan.doNotRun} empty="Chưa có keyword bị loại." />
          </section>

          <ModuleCard
            title="Copy nhanh cho triển khai"
            action={(
              <div className={styles.scImportActions}>
                <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(actionPlanCopy, 'kế hoạch hôm nay', canLaunch)}>{launchCopyLabel('Copy kế hoạch hôm nay', canLaunch)}</button>
                <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(copyBlocks.runKeywords || '', 'keyword nên chạy', canLaunch)}>{launchCopyLabel('Copy keyword chạy Ads', canLaunch)}</button>
                <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(matchTypeCopy, 'keyword theo match type', canLaunch)}>{launchCopyLabel('Copy keyword theo match type', canLaunch)}</button>
                <button className={styles.secondaryButton} type="button" onClick={() => copyText(copyBlocks.negativeKeywords || '', 'negative keywords')}>Copy negative keywords</button>
                <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(copyBlocks.campaignStructure || '', 'cấu trúc campaign/ad group', canLaunch)}>{launchCopyLabel('Copy campaign/ad group', canLaunch)}</button>
                <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(copyBlocks.adCopy || '', 'headline/description', canLaunch)}>{launchCopyLabel('Copy headline/description', canLaunch)}</button>
              </div>
            )}
          >
            <div className={styles.gridTwoTight}>
              <div className={styles.scV7InlinePanel}>
                <h3>Negative keywords</h3>
                {plan.negativeKeywords.slice(0, 30).map((item, index) => <p key={'negative-' + index + '-' + item.keyword}><b>{item.keyword}</b><span>{item.reason}</span></p>)}
              </div>
              <div className={styles.scV7InlinePanel}>
                <h3>Landing page cần tối ưu</h3>
                {plan.landingPageWarnings.slice(0, 12).map((item, index) => <p key={'landing-warning-' + index + '-' + item.url + item.title}><b>{item.title}</b><span>{item.url} - {item.warning}</span></p>)}
                {!plan.landingPageWarnings.length ? <p><b>Ổn</b><span>Chưa có cảnh báo landing page lớn.</span></p> : null}
              </div>
            </div>
          </ModuleCard>

          <ModuleCard title="Keyword copy sang Google Ads" description="Chỉ dùng exact và phrase match; không dùng broad match trong giai đoạn test ngân sách nhỏ." action={<button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(matchTypeCopy, 'keyword theo match type', canLaunch)}>{launchCopyLabel('Copy keyword theo match type', canLaunch)}</button>}>
            <div className={styles.v6List}>
              {matchTypeKeywords.slice(0, 10).map((block, index) => (
                <article className={styles.v61PlanTask} key={'match-type-' + index + '-' + block.adGroupName + block.finalUrl}>
                  <div><strong>{block.adGroupName}</strong><span>{block.finalUrl}</span></div>
                  <p><b>URL:</b> {block.urlStatus || 'Chờ xác nhận URL'} - <b>Ngân sách:</b> {block.dailyBudgetHint || 'Chưa bật - chờ dữ liệu'}</p>
                  <p><b>Exact:</b> {block.exactKeywords.slice(0, 12).join(', ')}</p>
                  <p><b>Phrase:</b> {block.phraseKeywords.slice(0, 12).join(', ')}</p>
                  <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(block.copyText, block.adGroupName + ' keyword', canLaunch)}>{launchCopyLabel('Copy nhóm keyword', canLaunch)}</button>
                </article>
              ))}
              {!matchTypeKeywords.length ? <EmptyState title="Chưa có keyword copy" /> : null}
            </div>
          </ModuleCard>

          <ModuleCard title="Headline / Description" action={<button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(copyBlocks.adCopy || '', 'headline/description', canLaunch)}>{launchCopyLabel('Copy headline/description', canLaunch)}</button>}>
            <div className={styles.v6List}>
              {adCopies.slice(0, 10).map((block, blockIndex) => (
                <article className={styles.v61PlanTask} key={'ad-copy-' + blockIndex + '-' + block.adGroupName + block.finalUrl}>
                  <div><strong>{block.adGroupName}</strong><span>{block.finalUrl}</span></div>
                  <div className={styles.adsPlannerCopyRows}>
                    <div><h3>Headlines</h3>{block.headlines.map((item, index) => <p key={'headline-' + blockIndex + '-' + index + '-' + item}><b>{charBadge(item, 30)}</b><span>{item}</span></p>)}</div>
                    <div><h3>Descriptions</h3>{block.descriptions.map((item, index) => <p key={'description-' + blockIndex + '-' + index + '-' + item}><b>{charBadge(item, 90)}</b><span>{item}</span></p>)}</div>
                  </div>
                  {block.warnings.length ? <details className={styles.adsPlannerDetails}><summary>Cảnh báo giới hạn ký tự ({block.warnings.length})</summary>{block.warnings.map((warning, index) => <p key={'copy-warning-' + blockIndex + '-' + index + '-' + warning}>{warning}</p>)}</details> : null}
                  <button className={styles.secondaryButton} type="button" disabled={!canLaunch} onClick={() => copyLaunchText(block.copyText, block.adGroupName + ' ad copy', canLaunch)}>{launchCopyLabel('Copy mẫu quảng cáo', canLaunch)}</button>
                </article>
              ))}
              {!adCopies.length ? <EmptyState title="Chưa có headline/description" /> : null}
            </div>
          </ModuleCard>

          <ModuleCard title="Ad group chi tiết">
            <div className={styles.v6List}>
              {plan.adGroups.map((group, index) => <AdGroupCard group={group} canLaunch={canLaunch} key={group.id + '-' + index} onCopy={copyText} />)}
              {!plan.adGroups.length ? <EmptyState title="Chưa có ad group đề xuất" /> : null}
            </div>
          </ModuleCard>

          <ModuleCard title="Lịch sử chạy AI Google Ads Planner">
            <div className={styles.v6List}>
              {state.history.slice(0, 8).map((item) => (
                <article className={styles.v61PlanMiniTask} key={item.id}>
                  <strong>{formatDate(item.generatedAt)}</strong>
                  <span>{formatNumber(item.totalKeywords)} keyword, {formatNumber(item.runAdsCount)} chạy ngay, {formatNumber(item.testAdsCount)} test nhỏ, {formatNumber(item.seoFirstCount)} SEO trước, {formatNumber(item.negativeCount)} negative, {formatNumber(item.campaignCount)} campaign/ad group.</span>
                </article>
              ))}
              {!state.history.length ? <EmptyState title="Chưa có lịch sử" /> : null}
            </div>
          </ModuleCard>
        </>
      ) : null}

      <p className={styles.adsV8CompactText}>Trang này chỉ tạo kế hoạch từ dữ liệu đã import. Không gọi Google Ads API, không tạo campaign thật và không thay đổi dữ liệu Google Ads/Keyword Planner cũ.</p>
    </main>
  );
}

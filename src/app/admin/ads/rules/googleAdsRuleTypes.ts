export type AdsRuleSource = 'OFFICIAL_POLICY' | 'PLATFORM_RULE' | 'BUSINESS_GUARDRAIL';
export type AdsRuleSourceType = 'OFFICIAL' | 'UNVERIFIED' | 'INTERNAL';
export type AdsRuleStatus = 'pass' | 'fail' | 'block' | 'warning' | 'unknown' | 'not_applicable';
export type AdsRuleSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AdsDiagnosticConfidence = 'Cao' | 'Trung bình' | 'Thấp' | 'Chưa đủ dữ liệu';

export type AdsReadinessCategory =
  | 'account-policy'
  | 'billing-verification'
  | 'conversion-tracking'
  | 'landing-page'
  | 'keyword-intent'
  | 'campaign-settings'
  | 'sales-followup';

export type GoogleAdsRuleCategory =
  | 'ACCOUNT_SECURITY'
  | 'BILLING_VERIFICATION'
  | 'POLICY_MISREPRESENTATION'
  | 'RESTRICTED_PROHIBITED_CONTENT'
  | 'LANDING_PAGE_DESTINATION'
  | 'PRIVACY_DATA'
  | 'CONVERSION'
  | 'CAMPAIGN_SETTINGS'
  | 'BIDDING_BUDGET'
  | 'KEYWORDS_SEARCH_TERMS'
  | 'AD_COPY_ASSETS'
  | 'OPTIMIZATION'
  | 'STOP_RULES';

export interface GoogleAdsRuleSourceMeta {
  sourceId: string;
  sourceUrl: string;
  sourceDomain: 'support.google.com/google-ads' | 'support.google.com/adspolicy' | 'developers.google.com/google-ads' | 'internal';
  sourceCheckedAt: string;
  sourceType: AdsRuleSourceType;
  noteVi: string;
}

export interface GoogleAdsRuleDefinition {
  id: string;
  title: string;
  source: AdsRuleSource;
  sourceId: string;
  sourceUrl: string;
  sourceDomain: GoogleAdsRuleSourceMeta['sourceDomain'];
  sourceCheckedAt: string;
  sourceType: AdsRuleSourceType;
  catalogVersion: string;
  category: GoogleAdsRuleCategory;
  readinessCategory: AdsReadinessCategory;
  severity: AdsRuleSeverity;
  summaryVi: string;
  successMessage?: string;
  blockerMessage?: string;
  unknownMessage?: string;
  active: boolean;
  stopRule?: boolean;
  canBlockLaunch: boolean;
  unknownBlocksLaunch?: boolean;
  defaultStatus: AdsRuleStatus;
  missingEvidence: string[];
  evidenceKeys: string[];
  recommendedActionVi: string;
  prohibitedActionVi: string;
  scoreImpact: number;
}

export type GoogleAdsRuleDefinitionDraft = Omit<
  GoogleAdsRuleDefinition,
  'sourceUrl' | 'sourceDomain' | 'sourceCheckedAt' | 'sourceType' | 'catalogVersion' | 'active'
> & {
  active?: boolean;
};

export interface AdsRuleEvaluation {
  id: string;
  source: AdsRuleSource;
  sourceId: string;
  sourceUrl: string;
  sourceDomain: GoogleAdsRuleSourceMeta['sourceDomain'];
  sourceCheckedAt: string;
  sourceType: AdsRuleSourceType;
  catalogVersion: string;
  category: GoogleAdsRuleCategory;
  readinessCategory: AdsReadinessCategory;
  severity: AdsRuleSeverity;
  title: string;
  summaryVi: string;
  successMessage: string;
  blockerMessage: string;
  unknownMessage: string;
  status: AdsRuleStatus;
  blocksLaunch: boolean;
  hardBlocker: string | null;
  criticalViolation: string | null;
  evidence: string;
  confidence: AdsDiagnosticConfidence;
  missingData: string[];
  recommendedCheck: string;
  allowedAction: string;
  forbiddenAction: string;
  recommendedActionVi: string;
  prohibitedActionVi: string;
  scoreImpact: number;
}

export interface GoogleAdsRuleAccountHistory {
  accountStatus?: string | null;
  billingStatus?: string | null;
  advertiserVerificationStatus?: string | null;
  policyStatus?: string | null;
  campaignStatus?: string | null;
  conversionTrackingStatus?: string | null;
  warningMessage?: string | null;
  evidenceSource?: string | null;
  notes?: string | null;
  dailyBudget?: number | null;
  actualSpend?: number | null;
  estimatedSpend?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  conversions?: number | null;
  phoneCalls?: number | null;
  zaloContacts?: number | null;
  formSubmissions?: number | null;
  orders?: number | null;
}

export interface GoogleAdsRuleAdGroupInput {
  finalUrl?: string | null;
  urlStatus?: string | null;
  dailyBudgetAmount?: number | null;
  keywordCount?: number | null;
  exactKeywords?: string[];
  phraseKeywords?: string[];
  negativeKeywords?: string[];
  headlines?: string[];
  descriptions?: string[];
  warnings?: string[];
}

export interface GoogleAdsRuleEngineInput {
  accountHistory: GoogleAdsRuleAccountHistory;
  adGroups: GoogleAdsRuleAdGroupInput[];
  landingWarnings: Array<{ url?: string | null; warning?: string | null; source?: string | null }>;
  googleAdsKeywordCount: number | null;
  searchConsoleRowsCount: number;
  productsCount: number;
  blogsCount: number;
  clustersCount: number;
  seoKeywordsCount: number;
  workLogsCount: number;
  keywordMapCount: number;
  businessVertical: 'furniture' | 'unknown';
  userDailyBudgetCap?: number | null;
}

export interface GoogleAdsRuleReadinessSnapshot {
  total: number;
  classification: 'Không chạy Ads' | 'Chỉ sửa và kiểm tra' | 'Có thể lập kế hoạch test nhỏ' | 'Đủ điều kiện test có kiểm soát';
  canLaunch: boolean;
  launchMessage: string;
  categories: Array<{ id: AdsReadinessCategory; label: string; maxScore: number; score: number; evidence: string }>;
  hardBlockers: string[];
  missingData: string[];
  ruleEvaluations: AdsRuleEvaluation[];
}

export interface GoogleAdsRuleEngineResult {
  overallStatus: 'ready' | 'limited' | 'blocked' | 'unknown';
  readinessScore: GoogleAdsRuleReadinessSnapshot;
  canLaunch: boolean;
  hardBlockers: string[];
  criticalViolations: AdsRuleEvaluation[];
  warnings: AdsRuleEvaluation[];
  recommendations: string[];
  passedRules: AdsRuleEvaluation[];
  unknownRules: AdsRuleEvaluation[];
  notApplicableRules: AdsRuleEvaluation[];
  missingEvidence: string[];
  nextRequiredAction: string;
  evaluatedAt: string;
  ruleCatalogVersion: string;
  evaluations: AdsRuleEvaluation[];
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getGoogleAdsKeywords } from '../services/googleAdsService';
import { getSearchConsoleMetrics } from '../services/searchConsoleService';
import {
  deleteDoNotTouchItem,
  deleteLocalSeoItem,
  deleteSeoCluster,
  deleteSeoCompetitor,
  deleteSeoGoal,
  deleteSeoKeyword,
  deleteSeoLog,
  deleteSeoPriority,
  deleteSeoProgress,
  deleteTodayTask,
  getDoNotTouchItems,
  getIndexStatus,
  getInternalLinkSuggestions,
  getLocalSeoItems,
  getProductSeoItems,
  getSeoClusters,
  getSeoCompetitors,
  getSeoGoals,
  getSeoHealth,
  getSeoKeywords,
  getSeoLogs,
  getSeoNote,
  getSeoOverview,
  getSeoPriorities,
  getSeoProgress,
  getTodayTasks,
  saveSeoNote,
  upsertDoNotTouchItem,
  upsertLocalSeoItem,
  upsertSeoCluster,
  upsertSeoCompetitor,
  upsertSeoGoal,
  upsertSeoKeyword,
  upsertSeoLog,
  upsertSeoPriority,
  upsertSeoProgress,
  upsertTodayTask,
} from '../services/seoDashboardService';
import type {
  DoNotTouchItem,
  GoogleAdsKeyword,
  IndexStatusItem,
  InternalLinkSuggestion,
  LocalSeoItem,
  ProductSeoItem,
  SearchConsoleMetrics,
  SeoCluster,
  SeoCompetitor,
  SeoGoal,
  SeoHealthSnapshot,
  SeoKeyword,
  SeoLog,
  SeoNote,
  SeoOverview,
  SeoPriority,
  SeoProgress,
  TodayTask,
} from '../types/seo';

interface DashboardState {
  overview: SeoOverview | null;
  searchConsole: SearchConsoleMetrics | null;
  adsMessage: string;
  adsKeywords: GoogleAdsKeyword[];
  priorities: SeoPriority[];
  tasks: TodayTask[];
  note: SeoNote | null;
  indexStatus: IndexStatusItem[];
  health: SeoHealthSnapshot | null;
  seoKeywords: SeoKeyword[];
  seoLogs: SeoLog[];
  seoProgress: SeoProgress[];
  seoGoals: SeoGoal[];
  localSeo: LocalSeoItem[];
  seoClusters: SeoCluster[];
  productSeoItems: ProductSeoItem[];
  internalLinkSuggestions: InternalLinkSuggestion[];
  doNotTouch: DoNotTouchItem[];
  seoCompetitors: SeoCompetitor[];
}

const initialState: DashboardState = {
  overview: null,
  searchConsole: null,
  adsMessage: 'Chưa kết nối Google Ads',
  adsKeywords: [],
  priorities: [],
  tasks: [],
  note: null,
  indexStatus: [],
  health: null,
  seoKeywords: [],
  seoLogs: [],
  seoProgress: [],
  seoGoals: [],
  localSeo: [],
  seoClusters: [],
  productSeoItems: [],
  internalLinkSuggestions: [],
  doNotTouch: [],
  seoCompetitors: [],
};

function errorMessage(prefix: string, err: unknown, fallback: string) {
  return `${prefix}: ${err instanceof Error ? err.message : fallback}`;
}

export function useSeoDashboard() {
  const [dashboard, setDashboard] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        overview,
        searchConsole,
        ads,
        priorities,
        tasks,
        note,
        indexStatus,
        health,
        seoKeywords,
        seoLogs,
        seoProgress,
        seoGoals,
        localSeo,
        seoClusters,
        productSeoItems,
        internalLinkSuggestions,
        doNotTouch,
        seoCompetitors,
      ] = await Promise.all([
        getSeoOverview(),
        getSearchConsoleMetrics(),
        getGoogleAdsKeywords(),
        getSeoPriorities(),
        getTodayTasks(),
        getSeoNote(),
        getIndexStatus(),
        getSeoHealth(),
        getSeoKeywords(),
        getSeoLogs(),
        getSeoProgress(),
        getSeoGoals(),
        getLocalSeoItems(),
        getSeoClusters(),
        getProductSeoItems(),
        getInternalLinkSuggestions(),
        getDoNotTouchItems(),
        getSeoCompetitors(),
      ]);

      setDashboard({
        overview,
        searchConsole,
        adsMessage: ads.message,
        adsKeywords: ads.keywords,
        priorities,
        tasks,
        note,
        indexStatus,
        health,
        seoKeywords,
        seoLogs,
        seoProgress,
        seoGoals,
        localSeo,
        seoClusters,
        productSeoItems,
        internalLinkSuggestions,
        doNotTouch,
        seoCompetitors,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được SEO Dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  async function persist<T>(work: () => Promise<T>, message: string) {
    setSaving(true);
    setError('');
    try { return await work(); }
    catch (err) { setError(errorMessage(message, err, 'kiểm tra bảng trong Supabase')); return null; }
    finally { setSaving(false); }
  }

  const actions = useMemo(() => ({
    reload: loadDashboard,
    savePriority: async (priority: Partial<SeoPriority>) => {
      const saved = await persist(() => upsertSeoPriority(priority), 'Chưa lưu được SEO Priority');
      if (saved) setDashboard((prev) => ({ ...prev, priorities: [saved, ...prev.priorities.filter((item) => item.id !== saved.id)] }));
    },
    removePriority: async (id: string) => {
      const ok = await persist(() => deleteSeoPriority(id).then(() => true), 'Chưa xóa được SEO Priority');
      if (ok) setDashboard((prev) => ({ ...prev, priorities: prev.priorities.filter((item) => item.id !== id) }));
    },
    saveTask: async (task: Partial<TodayTask>) => {
      const saved = await persist(() => upsertTodayTask(task), 'Chưa lưu được Today Task');
      if (saved) setDashboard((prev) => ({ ...prev, tasks: [saved, ...prev.tasks.filter((item) => item.id !== saved.id)] }));
    },
    removeTask: async (id: string) => {
      const ok = await persist(() => deleteTodayTask(id).then(() => true), 'Chưa xóa được Today Task');
      if (ok) setDashboard((prev) => ({ ...prev, tasks: prev.tasks.filter((item) => item.id !== id) }));
    },
    saveNote: async (content: string) => {
      const saved = await persist(() => saveSeoNote(content), 'Chưa lưu được SEO Note');
      if (saved) setDashboard((prev) => ({ ...prev, note: saved }));
    },
    saveKeyword: async (keyword: Partial<SeoKeyword>) => {
      const saved = await persist(() => upsertSeoKeyword(keyword), 'Chưa lưu được Keyword Tracker');
      if (saved) setDashboard((prev) => ({ ...prev, seoKeywords: [saved, ...prev.seoKeywords.filter((item) => item.id !== saved.id)] }));
    },
    removeKeyword: async (id: string) => {
      const ok = await persist(() => deleteSeoKeyword(id).then(() => true), 'Chưa xóa được Keyword Tracker');
      if (ok) setDashboard((prev) => ({ ...prev, seoKeywords: prev.seoKeywords.filter((item) => item.id !== id) }));
    },
    saveLog: async (log: Partial<SeoLog>) => {
      const saved = await persist(() => upsertSeoLog(log), 'Chưa lưu được SEO Timeline');
      if (saved) setDashboard((prev) => ({ ...prev, seoLogs: [saved, ...prev.seoLogs.filter((item) => item.id !== saved.id)] }));
    },
    removeLog: async (id: string) => {
      const ok = await persist(() => deleteSeoLog(id).then(() => true), 'Chưa xóa được SEO Timeline');
      if (ok) setDashboard((prev) => ({ ...prev, seoLogs: prev.seoLogs.filter((item) => item.id !== id) }));
    },
    saveProgress: async (progress: Partial<SeoProgress>) => {
      const saved = await persist(() => upsertSeoProgress(progress), 'Chưa lưu được Project Progress');
      if (saved) setDashboard((prev) => ({ ...prev, seoProgress: [saved, ...prev.seoProgress.filter((item) => item.id !== saved.id)] }));
    },
    removeProgress: async (id: string) => {
      const ok = await persist(() => deleteSeoProgress(id).then(() => true), 'Chưa xóa được Project Progress');
      if (ok) setDashboard((prev) => ({ ...prev, seoProgress: prev.seoProgress.filter((item) => item.id !== id) }));
    },
    saveGoal: async (goal: Partial<SeoGoal>) => {
      const saved = await persist(() => upsertSeoGoal(goal), 'Chưa lưu được Goal');
      if (saved) setDashboard((prev) => ({ ...prev, seoGoals: [saved, ...prev.seoGoals.filter((item) => item.id !== saved.id)] }));
    },
    removeGoal: async (id: string) => {
      const ok = await persist(() => deleteSeoGoal(id).then(() => true), 'Chưa xóa được Goal');
      if (ok) setDashboard((prev) => ({ ...prev, seoGoals: prev.seoGoals.filter((item) => item.id !== id) }));
    },
    saveLocalSeo: async (item: Partial<LocalSeoItem>) => {
      const saved = await persist(() => upsertLocalSeoItem(item), 'Chưa lưu được Local SEO');
      if (saved) setDashboard((prev) => ({ ...prev, localSeo: [saved, ...prev.localSeo.filter((row) => row.id !== saved.id)] }));
    },
    removeLocalSeo: async (id: string) => {
      const ok = await persist(() => deleteLocalSeoItem(id).then(() => true), 'Chưa xóa được Local SEO');
      if (ok) setDashboard((prev) => ({ ...prev, localSeo: prev.localSeo.filter((item) => item.id !== id) }));
    },
    saveCluster: async (cluster: Partial<SeoCluster>) => {
      const saved = await persist(() => upsertSeoCluster(cluster), 'Chưa lưu được Cluster Manager');
      if (saved) setDashboard((prev) => ({ ...prev, seoClusters: [saved, ...prev.seoClusters.filter((item) => item.id !== saved.id)] }));
    },
    removeCluster: async (id: string) => {
      const ok = await persist(() => deleteSeoCluster(id).then(() => true), 'Chưa xóa được Cluster Manager');
      if (ok) setDashboard((prev) => ({ ...prev, seoClusters: prev.seoClusters.filter((item) => item.id !== id) }));
    },
    saveDoNotTouch: async (item: Partial<DoNotTouchItem>) => {
      const saved = await persist(() => upsertDoNotTouchItem(item), 'Chưa lưu được Do Not Touch');
      if (saved) setDashboard((prev) => ({ ...prev, doNotTouch: [saved, ...prev.doNotTouch.filter((row) => row.id !== saved.id)] }));
    },
    removeDoNotTouch: async (id: string) => {
      const ok = await persist(() => deleteDoNotTouchItem(id).then(() => true), 'Chưa xóa được Do Not Touch');
      if (ok) setDashboard((prev) => ({ ...prev, doNotTouch: prev.doNotTouch.filter((item) => item.id !== id) }));
    },
    saveCompetitor: async (item: Partial<SeoCompetitor>) => {
      const saved = await persist(() => upsertSeoCompetitor(item), 'Chưa lưu được Competitor Watch');
      if (saved) setDashboard((prev) => ({ ...prev, seoCompetitors: [saved, ...prev.seoCompetitors.filter((row) => row.id !== saved.id)] }));
    },
    removeCompetitor: async (id: string) => {
      const ok = await persist(() => deleteSeoCompetitor(id).then(() => true), 'Chưa xóa được Competitor Watch');
      if (ok) setDashboard((prev) => ({ ...prev, seoCompetitors: prev.seoCompetitors.filter((item) => item.id !== id) }));
    },
  }), [loadDashboard]);

  return { dashboard, loading, saving, error, actions };
}

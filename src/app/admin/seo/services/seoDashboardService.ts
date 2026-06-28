import { supabase } from '@/lib/supabase';
import type { IndexStatusItem, LocalSeoItem, SeoGoal, SeoHealthSnapshot, SeoKeyword, SeoLog, SeoNote, SeoOverview, SeoPriority, SeoProgress, TodayTask } from '../types/seo';

async function countTable(table: string) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

async function safeList<T>(table: string, orderColumn = 'updated_at', ascending = false, limit?: number): Promise<T[]> {
  let query = supabase.from(table).select('*').order(orderColumn, { ascending });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) return [];
  return (data || []) as T[];
}

async function upsertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).upsert(payload).select().single();
  if (error) throw error;
  return data as T;
}

async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function getSeoOverview(): Promise<SeoOverview> {
  const [products, blogPosts, categories] = await Promise.all([countTable('products'), countTable('blog_posts'), countTable('categories')]);
  return { products, blogPosts, categories, generatedUrls: 1 + products + blogPosts + categories };
}

export async function getSeoPriorities(): Promise<SeoPriority[]> { return safeList<SeoPriority>('seo_priorities', 'rating', false); }
export async function upsertSeoPriority(priority: Partial<SeoPriority>) {
  return upsertRow<SeoPriority>('seo_priorities', { id: priority.id, keyword: priority.keyword || 'Từ khóa mới', rating: Math.max(1, Math.min(5, Number(priority.rating || 3))), note: priority.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoPriority(id: string) { await deleteRow('seo_priorities', id); }

export async function getTodayTasks(): Promise<TodayTask[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from('seo_tasks').select('*').eq('task_date', today).order('updated_at', { ascending: false });
  if (error) return [];
  return data || [];
}
export async function upsertTodayTask(task: Partial<TodayTask>) {
  return upsertRow<TodayTask>('seo_tasks', { id: task.id, title: task.title || 'Việc SEO mới', completed: Boolean(task.completed), task_date: task.task_date || new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() });
}
export async function deleteTodayTask(id: string) { await deleteRow('seo_tasks', id); }

export async function getSeoNote(): Promise<SeoNote | null> {
  const { data, error } = await supabase.from('seo_notes').select('*').eq('id', 'main').maybeSingle();
  if (error) return null;
  return data;
}
export async function saveSeoNote(content: string) { return upsertRow<SeoNote>('seo_notes', { id: 'main', content, updated_at: new Date().toISOString() }); }
export async function getIndexStatus(): Promise<IndexStatusItem[]> { return safeList<IndexStatusItem>('seo_index_status', 'created_at', false, 20); }

export async function getSeoKeywords(): Promise<SeoKeyword[]> { return safeList<SeoKeyword>('seo_keywords', 'priority', false, 50); }
export async function upsertSeoKeyword(keyword: Partial<SeoKeyword>) {
  return upsertRow<SeoKeyword>('seo_keywords', { id: keyword.id, keyword: keyword.keyword || 'Từ khóa mới', target_url: keyword.target_url || '/', priority: Number(keyword.priority || 3), status: keyword.status || 'Theo dõi', current_position: keyword.current_position ?? null, current_impression: keyword.current_impression ?? 0, note: keyword.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoKeyword(id: string) { await deleteRow('seo_keywords', id); }

export async function getSeoLogs(): Promise<SeoLog[]> { return safeList<SeoLog>('seo_logs', 'log_date', false, 30); }
export async function upsertSeoLog(log: Partial<SeoLog>) {
  return upsertRow<SeoLog>('seo_logs', { id: log.id, log_date: log.log_date || new Date().toISOString().slice(0, 10), action: log.action || 'Hành động SEO', target: log.target || 'Mục tiêu SEO', note: log.note || '', created_at: log.created_at || new Date().toISOString() });
}
export async function deleteSeoLog(id: string) { await deleteRow('seo_logs', id); }

export async function getSeoProgress(): Promise<SeoProgress[]> { return safeList<SeoProgress>('seo_progress', 'progress', false, 30); }
export async function upsertSeoProgress(progress: Partial<SeoProgress>) {
  return upsertRow<SeoProgress>('seo_progress', { id: progress.id, cluster: progress.cluster || 'Cụm SEO mới', progress: Math.max(0, Math.min(100, Number(progress.progress || 0))), note: progress.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoProgress(id: string) { await deleteRow('seo_progress', id); }

export async function getSeoGoals(): Promise<SeoGoal[]> { return safeList<SeoGoal>('seo_goals', 'updated_at', false, 20); }
export async function upsertSeoGoal(goal: Partial<SeoGoal>) {
  return upsertRow<SeoGoal>('seo_goals', { id: goal.id, title: goal.title || 'Mục tiêu SEO mới', target_value: Number(goal.target_value || 100), current_value: Number(goal.current_value || 0), unit: goal.unit || '', note: goal.note || '', updated_at: new Date().toISOString() });
}
export async function deleteSeoGoal(id: string) { await deleteRow('seo_goals', id); }

export async function getLocalSeoItems(): Promise<LocalSeoItem[]> { return safeList<LocalSeoItem>('seo_local_seo', 'updated_at', false, 20); }
export async function upsertLocalSeoItem(item: Partial<LocalSeoItem>) {
  return upsertRow<LocalSeoItem>('seo_local_seo', { id: item.id, name: item.name || 'Hạng mục Local SEO', value: item.value || '', status: item.status || 'warning', updated_at: new Date().toISOString() });
}
export async function deleteLocalSeoItem(id: string) { await deleteRow('seo_local_seo', id); }

export async function getSeoHealth(): Promise<SeoHealthSnapshot> {
  const response = await fetch('/api/admin/seo/health', { cache: 'no-store' });
  if (!response.ok) throw new Error('Không đọc được tình trạng hệ thống SEO');
  return response.json();
}

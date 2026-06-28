'use client';

import type { TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

export default function TodayTaskList({ tasks, saving, onSave, onDelete }: { tasks: TodayTask[]; saving: boolean; onSave: (task: Partial<TodayTask>) => void; onDelete: (id: string) => void }) {
  return <div className={styles.stack}><button className={styles.secondaryButton} onClick={() => onSave({ id: crypto.randomUUID(), title: 'Việc SEO mới', completed: false, task_date: new Date().toISOString().slice(0, 10) })} disabled={saving}>+ Thêm việc hôm nay</button>{tasks.length === 0 ? <p className={styles.muted}>Chưa có checklist hôm nay.</p> : null}{tasks.map((task) => <label className={styles.taskItem} key={task.id}><input type="checkbox" checked={task.completed} onChange={(event) => onSave({ ...task, completed: event.target.checked })} /><input value={task.title} onChange={(event) => onSave({ ...task, title: event.target.value })} aria-label="Nội dung công việc" /><button type="button" className={styles.iconButton} onClick={() => onDelete(task.id)} aria-label="Xóa công việc">×</button></label>)}</div>;
}

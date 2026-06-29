'use client';

import type { SeoCommand, TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayTaskList({ tasks, suggestions = [], saving, onSave, onDelete }: { tasks: TodayTask[]; suggestions?: SeoCommand[]; saving: boolean; onSave: (task: Partial<TodayTask>) => void; onDelete: (id: string) => void }) {
  const suggestedTasks = suggestions.slice(0, 5);

  return <div className={styles.stack}>
    <button className={styles.secondaryButton} onClick={() => onSave({ id: crypto.randomUUID(), title: 'Việc SEO mới', completed: false, task_date: todayString() })} disabled={saving}>+ Thêm việc hôm nay</button>
    {tasks.length === 0 ? <div className={styles.suggestionBox}><strong>Gợi ý việc hôm nay</strong><span>Dashboard tự tạo gợi ý từ dữ liệu website, bạn có thể bấm để lưu vào checklist.</span>{suggestedTasks.map((item) => <button type="button" className={styles.suggestionButton} key={item.id} disabled={saving} onClick={() => onSave({ id: crypto.randomUUID(), title: item.title, completed: false, task_date: todayString() })}>+ {item.title}</button>)}</div> : null}
    {tasks.map((task) => <label className={styles.taskItem} key={task.id}><input type="checkbox" checked={task.completed} onChange={(event) => onSave({ ...task, completed: event.target.checked })} /><input value={task.title} onChange={(event) => onSave({ ...task, title: event.target.value })} aria-label="Nội dung công việc" /><button type="button" className={styles.iconButton} onClick={() => onDelete(task.id)} aria-label="Xóa công việc">×</button></label>)}
  </div>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SeoCommand, TodayTask } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type TodayTaskListProps = {
  tasks: TodayTask[];
  suggestions?: SeoCommand[];
  saving: boolean;
  onSave: (task: Partial<TodayTask>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createNewTask(title: string): Partial<TodayTask> {
  return {
    id: createId(),
    title,
    completed: false,
    task_date: getTodayString(),
  };
}

function TaskItem({
  task,
  saving,
  onSave,
  onDelete,
}: {
  task: TodayTask;
  saving: boolean;
  onSave: TodayTaskListProps['onSave'];
  onDelete: TodayTaskListProps['onDelete'];
}) {
  const [localTitle, setLocalTitle] = useState(task.title);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleSaveTitle = () => {
    const nextTitle = localTitle.trim();

    if (!nextTitle) {
      setLocalTitle(task.title);
      return;
    }

    if (nextTitle === task.title) return;

    onSave({
      ...task,
      title: nextTitle,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.taskItem}>
      <input
        type="checkbox"
        checked={task.completed}
        disabled={saving}
        onChange={(event) =>
          onSave({
            ...task,
            completed: event.target.checked,
          })
        }
        aria-label={`Hoàn thành công việc: ${task.title}`}
      />

      <input
        value={localTitle}
        disabled={saving}
        onChange={(event) => setLocalTitle(event.target.value)}
        onBlur={handleSaveTitle}
        onKeyDown={handleKeyDown}
        aria-label="Nội dung công việc"
        placeholder="Nhập nội dung công việc"
      />

      <button
        type="button"
        className={styles.iconButton}
        disabled={saving}
        onClick={() => onDelete(task.id)}
        aria-label={`Xóa công việc: ${task.title}`}
      >
        ×
      </button>
    </div>
  );
}

export default function TodayTaskList({
  tasks,
  suggestions = [],
  saving,
  onSave,
  onDelete,
}: TodayTaskListProps) {
  const suggestedTasks = useMemo(() => suggestions.slice(0, 5), [suggestions]);

  return (
    <div className={styles.stack}>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={() => onSave(createNewTask('Việc SEO mới'))}
        disabled={saving}
      >
        + Thêm việc hôm nay
      </button>

      {tasks.length === 0 && (
        <div className={styles.suggestionBox}>
          <strong>Gợi ý việc hôm nay</strong>

          <span>
            Dashboard tự tạo gợi ý từ dữ liệu website, bạn có thể bấm để lưu vào checklist.
          </span>

          {suggestedTasks.map((item) => (
            <button
              type="button"
              className={styles.suggestionButton}
              key={item.id}
              disabled={saving}
              onClick={() => onSave(createNewTask(item.title))}
            >
              + {item.title}
            </button>
          ))}
        </div>
      )}

      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          saving={saving}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
// 'use client';

// import type { SeoCommand, TodayTask } from '../types/seo';
// import styles from '../seo-dashboard.module.css';

// function todayString() {
//   return new Date().toISOString().slice(0, 10);
// }

// export default function TodayTaskList({ tasks, suggestions = [], saving, onSave, onDelete }: { tasks: TodayTask[]; suggestions?: SeoCommand[]; saving: boolean; onSave: (task: Partial<TodayTask>) => void; onDelete: (id: string) => void }) {
//   const suggestedTasks = suggestions.slice(0, 5);

//   return <div className={styles.stack}>
//     <button className={styles.secondaryButton} onClick={() => onSave({ id: crypto.randomUUID(), title: 'Việc SEO mới', completed: false, task_date: todayString() })} disabled={saving}>+ Thêm việc hôm nay</button>
//     {tasks.length === 0 ? <div className={styles.suggestionBox}><strong>Gợi ý việc hôm nay</strong><span>Dashboard tự tạo gợi ý từ dữ liệu website, bạn có thể bấm để lưu vào checklist.</span>{suggestedTasks.map((item) => <button type="button" className={styles.suggestionButton} key={item.id} disabled={saving} onClick={() => onSave({ id: crypto.randomUUID(), title: item.title, completed: false, task_date: todayString() })}>+ {item.title}</button>)}</div> : null}
//     {tasks.map((task) => <label className={styles.taskItem} key={task.id}><input type="checkbox" checked={task.completed} onChange={(event) => onSave({ ...task, completed: event.target.checked })} /><input value={task.title} onChange={(event) => onSave({ ...task, title: event.target.value })} aria-label="Nội dung công việc" /><button type="button" className={styles.iconButton} onClick={() => onDelete(task.id)} aria-label="Xóa công việc">×</button></label>)}
//   </div>;
// }

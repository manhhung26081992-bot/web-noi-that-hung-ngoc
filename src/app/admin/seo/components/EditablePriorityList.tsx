'use client';

import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SeoPriority } from '../types/seo';
import styles from '../seo-dashboard.module.css';

type EditablePriorityListProps = {
  priorities: SeoPriority[];
  saving: boolean;
  onSave: (priority: Partial<SeoPriority>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function stars(rating: number) {
  const safeRating = Math.min(5, Math.max(1, Number(rating) || 1));

  return '★★★★★'.slice(0, safeRating) + '☆☆☆☆☆'.slice(0, 5 - safeRating);
}

function EditablePriorityItem({
  item,
  saving,
  onSave,
  onDelete,
}: {
  item: SeoPriority;
  saving: boolean;
  onSave: EditablePriorityListProps['onSave'];
  onDelete: EditablePriorityListProps['onDelete'];
}) {
  const [localKeyword, setLocalKeyword] = useState(item.keyword);

  useEffect(() => {
    setLocalKeyword(item.keyword);
  }, [item.keyword]);

  const handleSaveKeyword = () => {
    const nextKeyword = localKeyword.trim();

    if (!nextKeyword) {
      setLocalKeyword(item.keyword);
      return;
    }

    if (nextKeyword === item.keyword) return;

    onSave({
      ...item,
      keyword: nextKeyword,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className={styles.editRow}>
      <div className={styles.starBox}>{stars(item.rating)}</div>

      <input
        value={localKeyword}
        disabled={saving}
        onChange={(event) => setLocalKeyword(event.target.value)}
        onBlur={handleSaveKeyword}
        onKeyDown={handleKeyDown}
        aria-label="Từ khóa SEO"
        placeholder="Nhập từ khóa SEO"
      />

      <select
        value={item.rating}
        disabled={saving}
        onChange={(event) =>
          onSave({
            ...item,
            rating: Number(event.target.value),
          })
        }
        aria-label="Mức ưu tiên"
      >
        {[5, 4, 3, 2, 1].map((rating) => (
          <option key={rating} value={rating}>
            {rating} sao
          </option>
        ))}
      </select>

      <button
        type="button"
        className={styles.iconButton}
        disabled={saving}
        onClick={() => onDelete(item.id)}
        aria-label={`Xóa ưu tiên: ${item.keyword}`}
      >
        ×
      </button>
    </div>
  );
}

export default function EditablePriorityList({
  priorities,
  saving,
  onSave,
  onDelete,
}: EditablePriorityListProps) {
  const handleAddPriority = () => {
    onSave({
      id: createId(),
      keyword: 'Từ khóa SEO mới',
      rating: 3,
      note: '',
    });
  };

  return (
    <div className={styles.stack}>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={handleAddPriority}
        disabled={saving}
      >
        + Thêm ưu tiên
      </button>

      {priorities.length === 0 && (
        <p className={styles.muted}>
          Chưa có danh sách SEO Priority. Có thể cần tạo bảng seo_priorities trong Supabase.
        </p>
      )}

      {priorities.map((item) => (
        <EditablePriorityItem
          key={item.id}
          item={item}
          saving={saving}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// 'use client';

// import type { SeoPriority } from '../types/seo';
// import styles from '../seo-dashboard.module.css';

// function stars(rating: number) { return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating); }

// export default function EditablePriorityList({ priorities, saving, onSave, onDelete }: 
//   { priorities: SeoPriority[]; saving: boolean; onSave: (priority: Partial<SeoPriority>) => void; onDelete: (id: string) => void }) 
// {
//   return <div className={styles.stack}><button className={styles.secondaryButton}
//    onClick={() => onSave({ id: crypto.randomUUID(), keyword: 'Từ khóa SEO mới', rating: 3, note: '' })} disabled={saving}>+ Thêm ưu tiên</button>
//   {priorities.length === 0 ? <p className={styles.muted}>Chưa có danh sách SEO Priority. Có thể cần tạo bảng seo_priorities trong Supabase.</p> : null}
//   {priorities.map((item) => <div className={styles.editRow} key={item.id}><div className={styles.starBox}>{stars(item.rating)}</div>
//   <input value={item.keyword} onChange={(event) => onSave({ ...item, keyword: event.target.value })} aria-label="Từ khóa SEO" />
//   <select value={item.rating} onChange={(event) => onSave({ ...item, rating: Number(event.target.value) })} aria-label="Mức ưu tiên">
//     {[5, 4, 3, 2, 1].map((rating) => 
//     <option key={rating} value={rating}>{rating} sao</option>)}
//     </select>
//     <button className={styles.iconButton} onClick={() => onDelete(item.id)} aria-label="Xóa ưu tiên">
//       ×
//       </button>
//       </div>)}
//       </div>;
// }

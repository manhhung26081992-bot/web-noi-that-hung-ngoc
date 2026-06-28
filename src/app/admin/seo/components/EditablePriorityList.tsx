'use client';

import type { SeoPriority } from '../types/seo';
import styles from '../seo-dashboard.module.css';

function stars(rating: number) { return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating); }

export default function EditablePriorityList({ priorities, saving, onSave, onDelete }: { priorities: SeoPriority[]; saving: boolean; onSave: (priority: Partial<SeoPriority>) => void; onDelete: (id: string) => void }) {
  return <div className={styles.stack}><button className={styles.secondaryButton} onClick={() => onSave({ id: crypto.randomUUID(), keyword: 'Từ khóa SEO mới', rating: 3, note: '' })} disabled={saving}>+ Thêm ưu tiên</button>{priorities.length === 0 ? <p className={styles.muted}>Chưa có danh sách SEO Priority. Có thể cần tạo bảng seo_priorities trong Supabase.</p> : null}{priorities.map((item) => <div className={styles.editRow} key={item.id}><div className={styles.starBox}>{stars(item.rating)}</div><input value={item.keyword} onChange={(event) => onSave({ ...item, keyword: event.target.value })} aria-label="Từ khóa SEO" /><select value={item.rating} onChange={(event) => onSave({ ...item, rating: Number(event.target.value) })} aria-label="Mức ưu tiên">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}</select><button className={styles.iconButton} onClick={() => onDelete(item.id)} aria-label="Xóa ưu tiên">×</button></div>)}</div>;
}

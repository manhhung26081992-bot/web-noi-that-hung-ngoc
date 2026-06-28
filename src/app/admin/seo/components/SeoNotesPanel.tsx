'use client';

import { useEffect, useState } from 'react';
import type { SeoNote } from '../types/seo';
import styles from '../seo-dashboard.module.css';

export default function SeoNotesPanel({ note, saving, onSave }: { note: SeoNote | null; saving: boolean; onSave: (content: string) => void }) {
  const [content, setContent] = useState(note?.content || '');
  useEffect(() => { setContent(note?.content || ''); }, [note?.content]);
  return <div className={styles.stack}><textarea className={styles.noteArea} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ví dụ: Hôm nay không sửa Ghế. Lần tới thêm Bàn." /><button className={styles.primaryButton} onClick={() => onSave(content)} disabled={saving}>Lưu ghi chú SEO</button></div>;
}

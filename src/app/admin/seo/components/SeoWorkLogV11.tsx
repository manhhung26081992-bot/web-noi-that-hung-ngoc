'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../seo-dashboard.module.css';
import type { TodayTask } from '../types/seo';
import type { SeoWorkLogItem, SeoWorkPriority, SeoWorkStatus } from '../types/seoV11';
import { seoTargetGroups, seoWorkPriorities, seoWorkStatuses, seoWorkTypes } from '../types/seoV11';
import { createSeoWorkLogDraft, loadSeoWorkLogs, resetSeoWorkLogDemo, saveSeoWorkLogs } from '../lib/seoWorkLogStorage';

interface SeoWorkLogV11Props {
  tasks?: TodayTask[];
  noteContent?: string;
}

const emptyForm = createSeoWorkLogDraft();

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

function guessGroup(text: string) {
  const source = normalize(text);
  if (source.includes('giuong')) return 'Giường sắt / giường tầng sắt';
  if (source.includes('ban lam viec') || source.includes('ban van phong')) return 'Bàn làm việc / bàn văn phòng';
  if (source.includes('hoc sinh') || source.includes('truong hoc')) return 'Bàn ghế học sinh / nội thất trường học';
  if (source.includes('ghe chan quy')) return 'Ghế chân quỳ';
  if (source.includes('tu locker')) return 'Tủ locker';
  if (source.includes('blog') || source.includes('bai viet')) return 'Tin tức / blog';
  return 'Toàn website';
}

function guessType(text: string) {
  const source = normalize(text);
  if (source.includes('schema')) return 'Sửa schema';
  if (source.includes('404')) return 'Sửa lỗi 404';
  if (source.includes('internal') || source.includes('link')) return 'Internal link';
  if (source.includes('submit') || source.includes('index')) return 'Submit index';
  if (source.includes('faq')) return 'Tối ưu FAQ';
  if (source.includes('title') || source.includes('meta')) return 'Tối ưu title/meta';
  if (source.includes('bai viet') || source.includes('blog')) return 'Tối ưu bài viết';
  if (source.includes('san pham')) return 'Tối ưu sản phẩm';
  if (source.includes('danh muc')) return 'Tối ưu danh mục';
  return 'Khác';
}

export default function SeoWorkLogV11({ tasks = [], noteContent = '' }: SeoWorkLogV11Props) {
  const [logs, setLogs] = useState<SeoWorkLogItem[]>([]);
  const [form, setForm] = useState<SeoWorkLogItem>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('Tất cả');
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [noteDraft, setNoteDraft] = useState(noteContent);

  useEffect(() => {
    setLogs(loadSeoWorkLogs());
  }, []);

  useEffect(() => {
    setNoteDraft(noteContent);
  }, [noteContent]);

  function persist(nextLogs: SeoWorkLogItem[]) {
    const sorted = [...nextLogs].sort((a, b) => new Date(b.date || b.updatedAt).getTime() - new Date(a.date || a.updatedAt).getTime());
    setLogs(sorted);
    saveSeoWorkLogs(sorted);
  }

  function updateForm(field: keyof SeoWorkLogItem, value: string) {
    setForm((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(createSeoWorkLogDraft());
  }

  function saveLog() {
    const cleaned = createSeoWorkLogDraft({
      ...form,
      id: editingId || form.id,
      title: form.title.trim() || form.description.trim() || 'Việc SEO đã làm',
      updatedAt: new Date().toISOString(),
    });
    if (editingId) {
      persist(logs.map((item) => (item.id === editingId ? cleaned : item)));
    } else {
      persist([cleaned, ...logs]);
    }
    resetForm();
  }

  function editLog(item: SeoWorkLogItem) {
    setEditingId(item.id);
    setForm(item);
  }

  function removeLog(id: string) {
    if (!window.confirm('Bạn có chắc muốn xóa nhật ký SEO này không?')) return;
    persist(logs.filter((item) => item.id !== id));
  }

  function markStatus(id: string, status: SeoWorkStatus) {
    persist(logs.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
  }

  function saveTaskToLog(task: TodayTask) {
    const title = task.title || 'Việc SEO hôm nay';
    const log = createSeoWorkLogDraft({
      title,
      description: title,
      type: guessType(title),
      targetGroup: task.cluster || guessGroup(title),
      status: 'Đã làm',
      priority: task.priority === 'critical' || task.priority === 'high' ? 'Cao' : 'Trung bình',
      note: 'Tạo từ Today Task trong Dashboard SEO.',
    });
    persist([log, ...logs]);
  }

  function saveNoteToLog() {
    const content = noteDraft.trim();
    if (!content) return;
    const log = createSeoWorkLogDraft({
      title: content.slice(0, 90),
      description: content,
      type: guessType(content),
      targetGroup: guessGroup(content),
      status: 'Đã làm',
      priority: 'Trung bình',
      note: 'Chuyển từ SEO Note, ghi chú gốc vẫn được giữ nguyên.',
    });
    persist([log, ...logs]);
  }

  const filteredLogs = useMemo(() => {
    const keyword = normalize(search);
    return logs.filter((item) => {
      if (groupFilter !== 'Tất cả' && item.targetGroup !== groupFilter) return false;
      if (typeFilter !== 'Tất cả' && item.type !== typeFilter) return false;
      if (statusFilter !== 'Tất cả' && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return normalize([item.url, item.keyword, item.title, item.description, item.note].join(' ')).includes(keyword);
    });
  }, [logs, search, groupFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: logs.length,
      today: logs.filter((item) => item.date === today).length,
      submitted: logs.filter((item) => item.status === 'Đã submit index').length,
      needFix: logs.filter((item) => item.status === 'Cần sửa tiếp').length,
      watching: logs.filter((item) => item.status === 'Đang theo dõi').length,
      good: logs.filter((item) => item.status === 'Có tín hiệu tốt').length,
      bed: logs.filter((item) => item.targetGroup === 'Giường sắt / giường tầng sắt').length,
      desk: logs.filter((item) => item.targetGroup === 'Bàn làm việc / bàn văn phòng').length,
      school: logs.filter((item) => item.targetGroup === 'Bàn ghế học sinh / nội thất trường học').length,
    };
  }, [logs]);

  return (
    <section className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <span>SEO v11.0</span>
          <h2>Nhật ký SEO đã làm</h2>
          <p>Lưu lại các việc SEO đã triển khai để dashboard biết việc nào cần theo dõi và việc nào nên làm tiếp.</p>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={() => {
          if (window.confirm('Tải lại dữ liệu mẫu v11? Dữ liệu nhật ký hiện tại sẽ được thay bằng demo.')) {
            setLogs(resetSeoWorkLogDemo());
          }
        }}>Tải lại dữ liệu mẫu</button>
      </div>

      <div className={styles.metricGridSmall}>
        <div><span>Tổng việc đã lưu</span><strong>{stats.total}</strong></div>
        <div><span>Việc đã làm hôm nay</span><strong>{stats.today}</strong></div>
        <div><span>Đã submit index</span><strong>{stats.submitted}</strong></div>
        <div><span>Cần sửa tiếp</span><strong>{stats.needFix}</strong></div>
        <div><span>Đang theo dõi</span><strong>{stats.watching}</strong></div>
        <div><span>Có tín hiệu tốt</span><strong>{stats.good}</strong></div>
        <div><span>Nhóm giường sắt</span><strong>{stats.bed}</strong></div>
        <div><span>Nhóm bàn làm việc</span><strong>{stats.desk}</strong></div>
        <div><span>Nhóm trường học</span><strong>{stats.school}</strong></div>
      </div>

      <div className={styles.v11Stack}>
        <div className={styles.v11Panel}>
          <h3>{editingId ? 'Sửa nhật ký SEO' : 'Thêm việc SEO đã làm'}</h3>
          <div className={styles.v11FormGrid}>
            <label>Ngày làm<input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} /></label>
            <label>Loại công việc<select value={form.type} onChange={(event) => updateForm('type', event.target.value)}>{seoWorkTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Nhóm SEO<select value={form.targetGroup} onChange={(event) => updateForm('targetGroup', event.target.value)}>{seoTargetGroups.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>URL<input value={form.url} onChange={(event) => updateForm('url', event.target.value)} placeholder="/san-pham/... hoặc URL đầy đủ" /></label>
            <label>Keyword<input value={form.keyword} onChange={(event) => updateForm('keyword', event.target.value)} placeholder="Từ khóa liên quan" /></label>
            <label>Tiêu đề việc làm<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Ví dụ: Bổ sung FAQ cho giường tầng sắt" /></label>
            <label>Trạng thái<select value={form.status} onChange={(event) => updateForm('status', event.target.value as SeoWorkStatus)}>{seoWorkStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Ưu tiên<select value={form.priority} onChange={(event) => updateForm('priority', event.target.value as SeoWorkPriority)}>{seoWorkPriorities.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Ngày kiểm tra lại<input type="date" value={form.nextCheckDate || ''} onChange={(event) => updateForm('nextCheckDate', event.target.value)} /></label>
            <label className={styles.v11Wide}>Mô tả<textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Bạn đã làm gì, sửa ở đâu, kỳ vọng gì?" /></label>
            <label>Số liệu trước<input value={form.beforeMetric || ''} onChange={(event) => updateForm('beforeMetric', event.target.value)} placeholder="Ví dụ: CTR 0.5%" /></label>
            <label>Số liệu sau<input value={form.afterMetric || ''} onChange={(event) => updateForm('afterMetric', event.target.value)} placeholder="Điền sau khi có kết quả" /></label>
            <label className={styles.v11Wide}>Ghi chú<textarea value={form.note} onChange={(event) => updateForm('note', event.target.value)} placeholder="Ghi chú thêm nếu có" /></label>
          </div>
          <div className={styles.v11Actions}>
            <button className={styles.primaryButton} type="button" onClick={saveLog}>Lưu việc đã làm</button>
            {editingId && <button className={styles.secondaryButton} type="button" onClick={resetForm}>Hủy sửa</button>}
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.v11Panel}>
            <h3>Lưu Today Task vào nhật ký</h3>
            <p>Các task gốc vẫn được giữ nguyên, nút này chỉ tạo thêm một bản ghi nhật ký SEO.</p>
            {tasks.slice(0, 6).map((task) => (
              <div className={styles.v11MiniRow} key={'task-log-' + task.id}>
                <span>{task.title}</span>
                <button className={styles.secondaryButton} type="button" onClick={() => saveTaskToLog(task)}>Lưu vào nhật ký SEO</button>
              </div>
            ))}
            {tasks.length === 0 && <div className={styles.v11Empty}><strong>Chưa có task hôm nay.</strong><span>Bạn vẫn có thể nhập việc thủ công ở form bên trên.</span></div>}
          </div>

          <div className={styles.v11Panel}>
            <h3>Chuyển ghi chú thành nhật ký SEO</h3>
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Nội dung SEO Note hiện tại..." />
            <button className={styles.secondaryButton} type="button" onClick={saveNoteToLog}>Chuyển ghi chú thành nhật ký SEO</button>
            <p>Ghi chú gốc không bị xóa sau khi chuyển.</p>
          </div>
        </div>

        <div className={styles.v11Panel}>
          <h3>Danh sách nhật ký</h3>
          <div className={styles.v11FilterBar}>
            <label>Tìm kiếm<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm URL, keyword, tiêu đề, ghi chú..." /></label>
            <label>Nhóm SEO<select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option>Tất cả</option>{seoTargetGroups.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Loại việc<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Tất cả</option>{seoWorkTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Trạng thái<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Tất cả</option>{seoWorkStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className={styles.v11LogList}>
            {filteredLogs.slice(0, 40).map((item) => (
              <article className={styles.v11LogCard} key={item.id}>
                <div>
                  <small>{item.date} · {item.type} · {item.targetGroup}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {(item.url || item.keyword) && <p><strong>URL/Keyword:</strong> {[item.url, item.keyword].filter(Boolean).join(' · ')}</p>}
                  {item.note && <p><strong>Ghi chú:</strong> {item.note}</p>}
                </div>
                <div className={styles.v11StatusBox}>
                  <span>{item.status}</span>
                  <strong>{item.priority}</strong>
                  {item.nextCheckDate && <small>Kiểm tra lại: {item.nextCheckDate}</small>}
                  <button className={styles.secondaryButton} type="button" onClick={() => editLog(item)}>Sửa</button>
                  <button className={styles.secondaryButton} type="button" onClick={() => markStatus(item.id, 'Đang theo dõi')}>Đánh dấu đang theo dõi</button>
                  <button className={styles.secondaryButton} type="button" onClick={() => markStatus(item.id, 'Có tín hiệu tốt')}>Đánh dấu có tín hiệu tốt</button>
                  <button className={styles.secondaryButton} type="button" onClick={() => markStatus(item.id, 'Cần sửa tiếp')}>Đánh dấu cần sửa tiếp</button>
                  <button className={styles.dangerButton} type="button" onClick={() => removeLog(item.id)}>Xóa</button>
                </div>
              </article>
            ))}
            {filteredLogs.length === 0 && <div className={styles.v11Empty}><strong>Không có nhật ký phù hợp.</strong><span>Hãy đổi bộ lọc hoặc thêm việc SEO mới.</span></div>}
          </div>
        </div>
      </div>
    </section>
  );
}

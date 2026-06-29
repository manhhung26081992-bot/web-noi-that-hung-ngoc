import type { ChartPoint, ConnectionStatus, SystemHealthItem } from '../types/seo';
import styles from '../seo-dashboard.module.css';

export function ModuleCard({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className={styles.card}><div className={styles.cardHeader}><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div>{action}</div> : null}</div>{children}</section>;
}
export function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className={styles.metricCard}><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</div>;
}
export function Badge({ status, children }: { status: ConnectionStatus | SystemHealthItem['status']; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[status] || ''}`}>{children}</span>;
}
export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <div className={styles.emptyState}><strong>{title}</strong>{detail ? <span>{detail}</span> : null}</div>;
}
export function SkeletonGrid() {
  return <div className={styles.skeletonGrid}>{Array.from({ length: 8 }).map((_, index) => <div className={styles.skeleton} key={index} />)}</div>;
}
export function MiniBarChart({ data, label }: { data: ChartPoint[]; label: string }) {
  if (!data.length) return <EmptyState title="Chưa có dữ liệu biểu đồ" detail={label} />;
  const max = Math.max(...data.map((item) => item.impressions), 1);
  return <div className={styles.chart} aria-label={label}>{data.map((item, index) => <div className={styles.chartColumn} key={`${item.date}-${index}`}><span style={{ height: `${Math.max(8, (item.impressions / max) * 100)}%` }} /><small>{item.date}</small></div>)}</div>;
}


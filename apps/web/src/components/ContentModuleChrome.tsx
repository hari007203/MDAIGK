import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ContentModuleKey = 'subjects' | 'learning' | 'news' | 'quizzes' | 'games' | 'programmes' | 'certification';

export function ContentModulePage({ module, children }: { module: ContentModuleKey; children: ReactNode }) {
  return <div className={`content-module content-module--${module}`}>{children}</div>;
}

export function ContentModuleHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header className="content-module__header">
      <span className="content-module__icon" aria-hidden="true">
        <Icon size={24} strokeWidth={2.1} />
      </span>
      <div className="content-module__copy">
        <span className="content-module__eyebrow">Content management</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="content-module__actions">{actions}</div>}
    </header>
  );
}

export function ContentModuleStats({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; icon: LucideIcon; tone?: 'green' | 'gold' | 'blue' }>;
}) {
  return (
    <section className="content-module__stats" aria-label="Content summary">
      {items.map(({ label, value, icon: Icon, tone = 'green' }) => (
        <article className={`content-module__stat content-module__stat--${tone}`} key={label}>
          <span className="content-module__stat-icon" aria-hidden="true">
            <Icon size={19} />
          </span>
          <div className="content-module__stat-copy">
            <span className="content-module__stat-label">{label}</span>
            <strong className="content-module__stat-value">{value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

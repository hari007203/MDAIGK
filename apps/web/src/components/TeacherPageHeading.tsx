import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function TeacherPageHeading({
  icon: Icon,
  title,
  subtitle,
  actions,
  art,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  art?: string;
}) {
  return (
    <header className="teacher-page-heading">
      <span className="teacher-page-heading__icon" aria-hidden="true">
        <Icon size={25} strokeWidth={2.1} />
      </span>
      <div className="teacher-page-heading__copy">
        <span className="teacher-page-heading__eyebrow">Teacher portal</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {art && <img className="teacher-page-heading__art" src={art} alt="" aria-hidden="true" />}
      {actions && <div className="teacher-page-heading__actions">{actions}</div>}
    </header>
  );
}

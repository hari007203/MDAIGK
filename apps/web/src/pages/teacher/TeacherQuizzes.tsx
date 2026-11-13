import { useId, useState } from 'react';
import { BookOpen, CalendarDays, Check, ClipboardList, Clock3, Flag, FlaskConical, Leaf, Plus, Sigma, Trash2, type LucideIcon } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useGet, useMutate } from '../../api/hooks';
import type { QuizListRow } from '../../api/portalTypes';
import type { Paginated } from '../../api/types';
import { ErrorState, InlineAlert, Loading } from '../../components/Feedback';
import { StatusBadge } from '../../components/Badge';
import { FormField, FormGrid } from '../../components/Form';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../auth/AuthContext';
import { date, num } from '../../lib/format';
import { useTeacherClasses } from './shared';
import './TeacherQuizzes.css';

function QuizTrophy({ empty = false }: { empty?: boolean }) {
  const goldId = useId();
  return (
    <svg viewBox="0 0 180 150" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="137" rx="66" ry="8" fill="#e3eed6" />
      {empty && <path d="M18 125Q3 94 25 68Q46 86 29 125M151 126Q170 101 158 81Q139 99 151 126" fill="#89bb72" />}
      <path d="M57 30H31V43C31 63 44 76 63 76M123 30H149V43C149 63 136 76 117 76" stroke="#f5b800" strokeWidth="9" strokeLinecap="round" />
      <path d="M52 21H128V59C128 82 112 100 90 100S52 82 52 59V21Z" fill={`url(#${goldId})`} />
      <path d="M61 27V55C61 69 65 76 69 81" stroke="#fff3ab" strokeWidth="6" strokeLinecap="round" />
      <path d="M90 42L95 52L106 54L98 62L100 73L90 68L80 73L82 62L74 54L85 52L90 42Z" fill="#fff8c2" />
      <path d="M81 98H99V116H81Z" fill="#e5a000" />
      <path d="M72 114H108L118 128H62L72 114Z" fill="#ffc928" />
      <rect x="59" y="128" width="62" height="7" rx="3.5" fill="#e3a409" />
      <path d="M143 9L146 16L153 19L146 22L143 29L140 22L133 19L140 16L143 9Z" fill="#ffc928" />
      <path d="M30 85L33 91L39 94L33 97L30 103L27 97L21 94L27 91L30 85Z" fill="#66a75c" />
      <circle cx="35" cy="13" r="4" fill="#90bb72" />
      <circle cx="149" cy="104" r="4" fill="#ffc928" />
      <defs>
        <linearGradient id={goldId} x1="54" y1="27" x2="126" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe679" />
          <stop offset=".48" stopColor="#ffc928" />
          <stop offset="1" stopColor="#eda500" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function QuizSubjectIcon({ subject }: { subject: string }) {
  let Icon: LucideIcon = BookOpen;
  let tone = 'green';
  if (/science|physics|chemistry/i.test(subject)) Icon = FlaskConical;
  else if (/math/i.test(subject)) {
    Icon = Sigma;
    tone = 'gold';
  } else if (/social|history|civics|geography/i.test(subject)) {
    Icon = Flag;
    tone = 'gold';
  } else if (/environment|biology|nature/i.test(subject)) Icon = Leaf;
  return <span className={`teacher-quizzes-subject teacher-quizzes-subject--${tone}`} aria-hidden="true"><Icon size={32} strokeWidth={2} /></span>;
}

interface QDraft {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
const blankQ = (): QDraft => ({ prompt: '', options: ['', ''], correctIndex: 0, explanation: '' });

export function validateTeacherQuiz(title: string, qs: QDraft[]): Record<string, string> {
  const e: Record<string, string> = {};
  if (title.trim().length < 2) e.title = 'Enter a title (at least 2 characters)';
  if (!qs.length) e.questions = 'Add at least one question';
  qs.forEach((q, i) => {
    if (!q.prompt.trim()) e[`q${i}`] = `Question ${i + 1}: enter the question`;
    else if (q.options.length < 2 || q.options.some((o) => !o.trim())) e[`q${i}`] = `Question ${i + 1}: fill in every option (at least 2)`;
    else if (!q.options[q.correctIndex]?.trim()) e[`q${i}`] = `Question ${i + 1}: choose the correct option`;
  });
  return e;
}

/** Teachers author simple school-only activity quizzes (published immediately). */
export default function TeacherQuizzes() {
  const { user } = useAuth();
  const classes = useTeacherClasses();
  const q = useGet<Paginated<QuizListRow & { createdBy?: string; createdAt?: string }>>('/quizzes', { context: 'activity', pageSize: 100 });
  const mine = q.data?.items.filter((x) => x.schoolId && (!x.createdBy || x.createdBy === user?.id));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [qs, setQs] = useState<QDraft[]>([blankQ()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const subjects = [...new Map((classes.data ?? []).flatMap((c) => c.subjects).map((s) => [s._id, s])).values()];
  const levels = [...new Set((classes.data ?? []).filter((c) => !c.locked).map((c) => c.levelNumber))].sort((a, b) => a - b);

  const create = useMutate(
    () =>
      api.post('/quizzes', {
        title: title.trim(),
        context: 'activity',
        ...(subjectId ? { subjectId } : {}),
        ...(levels.length ? { classLevels: levels } : {}),
        questions: qs.map((x) => ({ prompt: x.prompt.trim(), options: x.options.map((o) => o.trim()), correctIndex: x.correctIndex, marks: 1, ...(x.explanation.trim() ? { explanation: x.explanation.trim() } : {}) })),
      }),
    {
      invalidate: ['/quizzes'],
      toastError: false,
      success: 'Quiz created — you can now use it in an activity',
      onSuccess: () => setOpen(false),
    },
  );

  function openNew() {
    setTitle('');
    setSubjectId('');
    setQs([blankQ()]);
    setErrors({});
    setFormError(null);
    setOpen(true);
  }

  function submit() {
    const v = validateTeacherQuiz(title, qs);
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length) return;
    create.mutate(undefined, { onError: (e) => setFormError(e instanceof ApiError ? e.message : 'Could not create the quiz.') });
  }

  const upd = (i: number, patch: Partial<QDraft>) => setQs((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="teacher-quizzes-page">
      <header className="teacher-quizzes-heading">
        <span className="teacher-quizzes-heading__art"><QuizTrophy /></span>
        <div className="teacher-quizzes-heading__copy">
          <h1>My quizzes</h1>
          <p>Create quizzes for your own classes.</p>
        </div>
        <button type="button" className="btn btn--primary teacher-quizzes-new" onClick={openNew}>
          <Plus size={18} aria-hidden /> New quiz
        </button>
      </header>
      {mine !== undefined && (
        <section className="teacher-quizzes-summary" aria-label="Quiz summary">
          <div className="teacher-quizzes-stat">
            <span className="teacher-quizzes-stat__icon" aria-hidden="true"><ClipboardList size={28} /></span>
            <div><strong>{num(mine.length)}</strong><span>Total Quizzes</span></div>
          </div>
          <div className="teacher-quizzes-stat teacher-quizzes-stat--published">
            <span className="teacher-quizzes-stat__icon" aria-hidden="true"><Check size={32} strokeWidth={3} /></span>
            <div><strong>{num(mine.filter((r) => r.status === 'published').length)}</strong><span>Published</span></div>
          </div>
          <div className="teacher-quizzes-stat teacher-quizzes-stat--archived">
            <span className="teacher-quizzes-stat__icon" aria-hidden="true"><Clock3 size={28} /></span>
            <div><strong>{num(mine.filter((r) => r.status === 'archived').length)}</strong><span>Archived</span></div>
          </div>
        </section>
      )}
      <p className="teacher-quizzes-note">Quizzes are published straight away and can be attached to quiz activities.</p>
      <section className="teacher-quizzes-results" aria-label="My quizzes" aria-busy={q.isFetching}>
        {q.isLoading && !mine ? <Loading /> : q.isError && !mine ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : !mine?.length ? (
          <div className="teacher-quizzes-empty" role="status">
            <span className="teacher-quizzes-empty__art"><QuizTrophy empty /></span>
            <h2>You haven’t written any quizzes yet</h2>
            <p>Platform quizzes are always available in the activity quiz picker.</p>
          </div>
        ) : (
          <>
            <p className="teacher-quizzes-results__caption">Your quizzes in the loaded results</p>
            <ul className="teacher-quizzes-list">
              {mine.map((r, i) => {
                const subject = typeof r.subjectId === 'object' && r.subjectId ? r.subjectId.name : '—';
                return (
                  <li key={r._id} className="teacher-quizzes-card" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                    <QuizSubjectIcon subject={subject} />
                    <div className="teacher-quizzes-card__copy">
                      <h2>{r.title}</h2>
                      <div className="teacher-quizzes-card__meta">
                        <span>{subject}</span>
                        <span>{r.classLevels?.length ? r.classLevels.map((level) => `Class ${level}`).join(' · ') : r.context}</span>
                      </div>
                      <div className="teacher-quizzes-card__details">
                        <span><ClipboardList size={13} aria-hidden /> {r.questionCount ?? '—'} Questions</span>
                        <span><CalendarDays size={13} aria-hidden /> Created {date(r.createdAt ?? null)}</span>
                      </div>
                    </div>
                    <div className={`teacher-quizzes-card__status teacher-quizzes-card__status--${r.status}`}><StatusBadge status={r.status} /></div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      <Modal
        open={open}
        title="New activity quiz"
        size="lg"
        onClose={() => setOpen(false)}
        busy={create.isPending}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={submit} disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create quiz'}
            </button>
          </>
        }
      >
        <div className="stack">
          {formError && <InlineAlert>{formError}</InlineAlert>}
          <FormGrid>
            <FormField label="Title" required error={errors.title}>
              <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <FormField label="Subject" hint="Needed for it to appear in the activity quiz picker">
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">None</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>
          {errors.questions && <InlineAlert>{errors.questions}</InlineAlert>}
          {qs.map((x, i) => (
            <fieldset key={i} className="question-card">
              <legend>
                Question {i + 1}
                {qs.length > 1 && (
                  <button type="button" className="icon-btn icon-btn--sm" aria-label={`Remove question ${i + 1}`} onClick={() => setQs((l) => l.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </button>
                )}
              </legend>
              {errors[`q${i}`] && <p className="field__error">{errors[`q${i}`]}</p>}
              <FormField label="Question" required>
                <input value={x.prompt} maxLength={1000} onChange={(e) => upd(i, { prompt: e.target.value })} />
              </FormField>
              <div className="stack--sm" role="radiogroup" aria-label={`Options for question ${i + 1}; select the correct one`}>
                {x.options.map((o, oi) => (
                  <div key={oi} className="option-row">
                    <input type="radio" name={`correct-${i}`} checked={x.correctIndex === oi} onChange={() => upd(i, { correctIndex: oi })} aria-label={`Option ${oi + 1} is correct`} />
                    <input
                      value={o}
                      maxLength={300}
                      placeholder={`Option ${oi + 1}`}
                      aria-label={`Option ${oi + 1}`}
                      onChange={(e) => upd(i, { options: x.options.map((v, k) => (k === oi ? e.target.value : v)) })}
                    />
                    {x.options.length > 2 && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        aria-label={`Remove option ${oi + 1}`}
                        onClick={() => upd(i, { options: x.options.filter((_, k) => k !== oi), correctIndex: x.correctIndex === oi ? 0 : x.correctIndex > oi ? x.correctIndex - 1 : x.correctIndex })}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {x.options.length < 6 && (
                  <button type="button" className="link-btn" onClick={() => upd(i, { options: [...x.options, ''] })}>
                    + Add option
                  </button>
                )}
              </div>
              <FormField label="Explanation (shown after submit)">
                <input value={x.explanation} maxLength={1000} onChange={(e) => upd(i, { explanation: e.target.value })} />
              </FormField>
            </fieldset>
          ))}
          {qs.length < 50 && (
            <button type="button" className="btn btn--secondary" onClick={() => setQs((l) => [...l, blankQ()])}>
              <Plus size={14} aria-hidden /> Add question
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

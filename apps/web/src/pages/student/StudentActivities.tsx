import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  LayoutGrid,
  List,
  MessageSquare,
  Play,
} from 'lucide-react';
import { api } from '../../api/client';
import { useGet, useMutate } from '../../api/hooks';
import type { StudentActivity } from '../../api/portalTypes';
import { QueryState } from '../../components/Feedback';
import { FormField } from '../../components/Form';
import { Modal } from '../../components/Modal';
import { ACTIVITY_TYPE_LABEL } from './shared';
import { activityLink } from './StudentHome';
import './StudentActivities.css';

function getActivityArt(subjectName?: string, subjectCode?: string, type?: string): string {
  const s = `${subjectName ?? ''} ${subjectCode ?? ''}`.toLowerCase();
  if (s.includes('math') || s.includes('algebra') || s.includes('geom') || s.includes('calc')) {
    return '/assets/student-activities/math.jpg';
  }
  if (s.includes('sci') || s.includes('phys') || s.includes('chem') || s.includes('bio')) {
    return '/assets/student-activities/science.jpg';
  }
  if (s.includes('gk') || s.includes('general') || s.includes('world') || s.includes('geo') || s.includes('social')) {
    return '/assets/student-activities/globe.jpg';
  }
  if (s.includes('eng') || s.includes('lang') || s.includes('lit') || s.includes('read')) {
    return '/assets/student-activities/english.jpg';
  }
  if (type === 'worksheet' || type === 'practice') {
    return '/assets/student-activities/practice.jpg';
  }
  return '/assets/student-activities/math.jpg';
}

function getSubjectTheme(subjectName?: string) {
  const s = (subjectName ?? '').toLowerCase();
  if (s.includes('math') || s.includes('algebra')) {
    return { bg: '#e6f7ec', text: '#065f46', border: '#ccefd7' };
  }
  if (s.includes('sci')) {
    return { bg: '#f1eafa', text: '#6b21a8', border: '#e3d5f8' };
  }
  if (s.includes('gk') || s.includes('general') || s.includes('social')) {
    return { bg: '#fff0e6', text: '#c2410c', border: '#fed7aa' };
  }
  if (s.includes('eng') || s.includes('lang') || s.includes('lit')) {
    return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
  }
  return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
}

function getTeacherAvatar(teacherName?: string): string {
  const n = (teacherName ?? '').toLowerCase();
  if (n.includes('rhea') || n.includes('lakshmi')) return '/assets/student-activities/teacher-rhea.png';
  if (n.includes('arjun') || n.includes('rahul') || n.includes('mr.')) return '/assets/student-activities/teacher-arjun.png';
  return '/assets/student-activities/teacher-priya.png';
}

function formatDueDate(isoString?: string): string {
  if (!isoString) return 'No due date';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'No due date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StudentActivities() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('status') ?? 'pending';

  const allActivitiesQuery = useGet<StudentActivity[]>('/student/activities', { status: 'all' });
  const [completing, setCompleting] = useState<StudentActivity | null>(null);
  const [note, setNote] = useState('');

  const complete = useMutate(
    (v: { id: string; note: string }) =>
      api.post(`/student/activities/${v.id}/complete`, v.note.trim() ? { note: v.note.trim() } : {}),
    {
      invalidate: ['/student'],
      success: 'Marked as complete. Well done!',
      onSuccess: () => {
        setCompleting(null);
        setNote('');
      },
    },
  );

  return (
    <div className="student-activities-page">
      {/* 1. Hero Banner */}
      <section className="activities-hero" aria-labelledby="activities-hero-title">
        <div className="activities-hero__content">
          <h1 id="activities-hero-title" className="activities-hero__title">
            My Activities
          </h1>
          <p className="activities-hero__subtitle">
            Your learning journey starts here. Explore activities, complete challenges and keep growing!
          </p>
        </div>
      </section>

      <QueryState query={allActivitiesQuery} loadingLabel="Loading activities…">
        {(allList) => {
          const totalCount = allList.length;
          const todoCount = allList.filter((a) => !a.completed).length;
          const completedCount = allList.filter((a) => a.completed).length;
          const upcomingCount = allList.filter((a) => !a.completed && !a.overdue).length;

          const filteredList =
            activeTab === 'completed'
              ? allList.filter((a) => a.completed)
              : activeTab === 'all'
                ? allList
                : allList.filter((a) => !a.completed);

          return (
            <>
              {/* 2. Four Summary Cards */}
              <section className="activities-summary-grid" aria-label="Activity statistics">
                {/* Total Activities */}
                <div
                  role="button"
                  tabIndex={0}
                  className="activity-summary-card activity-summary-card--total"
                  onClick={() => setParams({ status: 'all' })}
                  onKeyDown={(e) => e.key === 'Enter' && setParams({ status: 'all' })}
                  title="View all activities"
                >
                  <div className="activity-summary-card__left">
                    <div className="activity-summary-card__icon-wrap">
                      <img
                        src="/assets/student-activities/icon-total.png"
                        alt=""
                        className="activity-summary-card__icon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="activity-summary-card__text">
                      <span className="activity-summary-card__label">Total Activities</span>
                      <strong className="activity-summary-card__count">{totalCount}</strong>
                    </div>
                  </div>
                  <span className="activity-summary-card__arrow" aria-hidden="true">
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </div>

                {/* To Do */}
                <div
                  role="button"
                  tabIndex={0}
                  className="activity-summary-card activity-summary-card--todo"
                  onClick={() => setParams({ status: 'pending' })}
                  onKeyDown={(e) => e.key === 'Enter' && setParams({ status: 'pending' })}
                  title="View to do activities"
                >
                  <div className="activity-summary-card__left">
                    <div className="activity-summary-card__icon-wrap">
                      <img
                        src="/assets/student-activities/icon-todo.png"
                        alt=""
                        className="activity-summary-card__icon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="activity-summary-card__text">
                      <span className="activity-summary-card__label">To Do</span>
                      <strong className="activity-summary-card__count">{todoCount}</strong>
                    </div>
                  </div>
                  <span className="activity-summary-card__arrow" aria-hidden="true">
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </div>

                {/* Completed */}
                <div
                  role="button"
                  tabIndex={0}
                  className="activity-summary-card activity-summary-card--completed"
                  onClick={() => setParams({ status: 'completed' })}
                  onKeyDown={(e) => e.key === 'Enter' && setParams({ status: 'completed' })}
                  title="View completed activities"
                >
                  <div className="activity-summary-card__left">
                    <div className="activity-summary-card__icon-wrap">
                      <img
                        src="/assets/student-activities/icon-completed.png"
                        alt=""
                        className="activity-summary-card__icon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="activity-summary-card__text">
                      <span className="activity-summary-card__label">Completed</span>
                      <strong className="activity-summary-card__count">{completedCount}</strong>
                    </div>
                  </div>
                  <span className="activity-summary-card__arrow" aria-hidden="true">
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </div>

                {/* Upcoming */}
                <div
                  role="button"
                  tabIndex={0}
                  className="activity-summary-card activity-summary-card--upcoming"
                  onClick={() => setParams({ status: 'pending' })}
                  onKeyDown={(e) => e.key === 'Enter' && setParams({ status: 'pending' })}
                  title="View upcoming activities"
                >
                  <div className="activity-summary-card__left">
                    <div className="activity-summary-card__icon-wrap">
                      <img
                        src="/assets/student-activities/icon-upcoming.png"
                        alt=""
                        className="activity-summary-card__icon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="activity-summary-card__text">
                      <span className="activity-summary-card__label">Upcoming</span>
                      <strong className="activity-summary-card__count">{upcomingCount}</strong>
                    </div>
                  </div>
                  <span className="activity-summary-card__arrow" aria-hidden="true">
                    <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </div>
              </section>

              {/* 3. Filter Navigation */}
              <nav className="activities-filters-wrap" aria-label="Activity filter">
                <button
                  type="button"
                  className={`activity-filter-btn ${activeTab === 'pending' ? 'activity-filter-btn--active' : ''}`}
                  onClick={() => setParams({ status: 'pending' })}
                  aria-pressed={activeTab === 'pending'}
                >
                  <List size={17} aria-hidden="true" />
                  <span>To Do</span>
                </button>
                <button
                  type="button"
                  className={`activity-filter-btn ${activeTab === 'completed' ? 'activity-filter-btn--active' : ''}`}
                  onClick={() => setParams({ status: 'completed' })}
                  aria-pressed={activeTab === 'completed'}
                >
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>Completed</span>
                </button>
                <button
                  type="button"
                  className={`activity-filter-btn ${activeTab === 'all' ? 'activity-filter-btn--active' : ''}`}
                  onClick={() => setParams({ status: 'all' })}
                  aria-pressed={activeTab === 'all'}
                >
                  <LayoutGrid size={17} aria-hidden="true" />
                  <span>All</span>
                </button>
              </nav>

              {/* 4. Activity Cards Grid */}
              <section className="activities-cards-grid" aria-label="Activities list">
                {filteredList.length === 0 ? (
                  <div className="activities-empty-state">
                    <img
                      src="/assets/student-activities/practice.jpg"
                      alt=""
                      className="activities-empty-state__icon"
                    />
                    <h3 className="activities-empty-state__title">
                      {activeTab === 'pending'
                        ? 'Nothing to do right now'
                        : activeTab === 'completed'
                          ? 'No completed activities yet'
                          : 'No activities found'}
                    </h3>
                    <p className="activities-empty-state__text">
                      {activeTab === 'pending'
                        ? 'New quizzes, practice worksheets and challenges from your teachers will appear here.'
                        : 'Completed assignments and quiz results will show up here.'}
                    </p>
                  </div>
                ) : (
                  filteredList.map((a) => {
                    const theme = getSubjectTheme(a.subjectId?.name);
                    const artSrc = getActivityArt(a.subjectId?.name, a.subjectId?.code, a.type);
                    const teacherName = a.teacherId?.name ?? 'Teacher';
                    const teacherAvatar = getTeacherAvatar(teacherName);

                    // Status pill details
                    let statusLabel = 'To Do';
                    let statusClass = 'activity-card-item__status-badge--todo';
                    if (a.completed) {
                      statusLabel = 'Completed';
                      statusClass = 'activity-card-item__status-badge--completed';
                    } else if (a.overdue) {
                      statusLabel = 'Overdue';
                      statusClass = 'activity-card-item__status-badge--overdue';
                    } else if (a.result) {
                      statusLabel = 'In Progress';
                      statusClass = 'activity-card-item__status-badge--in_progress';
                    }

                    // Button details
                    const isQuiz = a.type === 'quiz';
                    let btnText = 'Start Activity';
                    if (a.completed) {
                      btnText = isQuiz ? 'Review Quiz' : 'Completed';
                    } else if (a.result) {
                      btnText = 'Continue';
                    }

                    return (
                      <article key={a._id} className="activity-card-item">
                        {/* Top Art Area */}
                        <div className="activity-card-item__art-wrap">
                          <img
                            src={artSrc}
                            alt=""
                            className="activity-card-item__art-img"
                            loading="lazy"
                          />
                          <div
                            className={`activity-card-item__status-badge ${statusClass}`}
                            aria-label={`Status: ${statusLabel}`}
                          >
                            <span className="activity-card-item__status-dot" aria-hidden="true" />
                            <span>{statusLabel}</span>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="activity-card-item__body">
                          <span
                            className="activity-card-item__subject-badge"
                            style={{
                              backgroundColor: theme.bg,
                              color: theme.text,
                              borderColor: theme.border,
                            }}
                          >
                            {a.subjectId?.name ?? ACTIVITY_TYPE_LABEL[a.type]}
                          </span>

                          <h2 className="activity-card-item__title" title={a.title}>
                            {a.title}
                          </h2>

                          <p className="activity-card-item__desc">
                            {a.instructions?.trim()
                              ? a.instructions
                              : a.worksheetRef
                                ? `Worksheet: ${a.worksheetRef}`
                                : `Complete this ${ACTIVITY_TYPE_LABEL[a.type].toLowerCase()} assigned by ${teacherName}.`}
                          </p>

                          {a.teacherFeedback && (
                            <p
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: '#004c37',
                                background: '#f0fdf4',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                marginBottom: '12px',
                              }}
                            >
                              <MessageSquare size={13} aria-hidden="true" />
                              <strong style={{ fontWeight: 600 }}>Feedback:</strong> {a.teacherFeedback}
                            </p>
                          )}

                          {/* Meta Row: Teacher & Due Date */}
                          <div className="activity-card-item__meta">
                            <div className="activity-card-item__teacher">
                              <img
                                src={teacherAvatar}
                                alt=""
                                className="activity-card-item__teacher-avatar"
                                aria-hidden="true"
                              />
                              <span className="activity-card-item__teacher-name" title={teacherName}>
                                {teacherName}
                              </span>
                            </div>

                            <div className="activity-card-item__due">
                              <Calendar size={14} aria-hidden="true" />
                              <span>{a.completed ? `Done ${formatDueDate(a.completedAt ?? a.dueAt)}` : `Due: ${formatDueDate(a.dueAt)}`}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          {a.completed ? (
                            isQuiz && a.quizId ? (
                              <Link to={activityLink(a)} className="activity-card-item__btn activity-card-item__btn--secondary">
                                <span>{btnText}</span>
                                <ArrowRight size={15} aria-hidden="true" />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="activity-card-item__btn activity-card-item__btn--secondary"
                                style={{ opacity: 0.85, cursor: 'default' }}
                              >
                                <CheckCircle2 size={15} aria-hidden="true" />
                                <span>Completed</span>
                              </button>
                            )
                          ) : isQuiz ? (
                            a.quizId ? (
                              <Link to={activityLink(a)} className="activity-card-item__btn">
                                <Play size={13} fill="currentColor" aria-hidden="true" />
                                <span>{btnText}</span>
                                <ArrowRight size={15} aria-hidden="true" />
                              </Link>
                            ) : (
                              <button type="button" disabled className="activity-card-item__btn" style={{ opacity: 0.6 }}>
                                <span>Quiz Unavailable</span>
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              className="activity-card-item__btn"
                              onClick={() => setCompleting(a)}
                            >
                              <Play size={13} fill="currentColor" aria-hidden="true" />
                              <span>{btnText}</span>
                              <ArrowRight size={15} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            </>
          );
        }}
      </QueryState>

      {/* Completion Modal */}
      <Modal
        open={Boolean(completing)}
        title={`Mark “${completing?.title ?? ''}” complete`}
        onClose={() => setCompleting(null)}
        busy={complete.isPending}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCompleting(null)}
              disabled={complete.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--mango"
              disabled={complete.isPending}
              onClick={() => completing && complete.mutate({ id: completing._id, note })}
            >
              {complete.isPending ? 'Saving…' : 'Mark complete'}
            </button>
          </>
        }
      >
        <FormField
          label="Note for your teacher (optional)"
          hint={`${note.length}/500`}
          error={note.length > 500 ? 'Keep your note under 500 characters' : undefined}
        >
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="What did you do? Anything you found hard?"
          />
        </FormField>
      </Modal>
    </div>
  );
}

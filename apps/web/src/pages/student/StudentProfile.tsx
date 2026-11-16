import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, LogOut, School, Settings, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useGet, useMutate } from '../../api/hooks';
import type { StudentProfileData } from '../../api/portalTypes';
import { useAuth } from '../../auth/AuthContext';
import { Card, PageHeader } from '../../components/Cards';
import { InlineAlert, QueryState } from '../../components/Feedback';
import { FormField } from '../../components/Form';
import { AVATARS, Avatar } from './shared';
import './StudentProfile.css';

export function validateDisplayName(v: string): string | undefined {
  const t = v.trim();
  if (!t) return 'Enter a display name';
  if (t.length > 40) return 'Keep it to 40 characters or fewer';
  return undefined;
}

export default function StudentProfilePage() {
  const q = useGet<StudentProfileData>('/student/profile');
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (q.data) {
      setName(q.data.displayName || q.data.name);
      setAvatar(q.data.avatar ?? '');
    }
  }, [q.data]);

  const save = useMutate((body: { displayName: string; avatar?: string }) => api.patch<StudentProfileData>('/student/profile', body), {
    invalidate: ['/student'],
    toastError: false,
    success: 'Profile saved',
    onSuccess: () => {
      setSaved(true);
      void refreshUser().catch(() => undefined);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const v = validateDisplayName(name);
    setErr(v);
    if (v) return;
    save.mutate(avatar ? { displayName: name.trim(), avatar } : { displayName: name.trim() });
  }

  return (
    <div className="student-page student-profile-page">
      <PageHeader title="My profile" />
      <QueryState query={q} loadingLabel="Loading profile…">
        {(p) => (
          <>
            <Card className="profile-summary-card">
              <div className="profile-head">
                <Avatar avatar={avatar} name={name || p.name} size="lg" />
                <div>
                  <h2>{name || p.name}</h2>
                  <p className="muted">
                    Class {p.levelNumber}-{p.section} · {p.schoolName}
                  </p>
                </div>
              </div>
              <dl className="profile-info-grid">
                <div className="profile-info-item"><span className="profile-info-icon"><UserRound size={19} aria-hidden /></span><div><dt>Full name</dt><dd>{p.name}</dd></div></div>
                <div className="profile-info-item"><span className="profile-info-icon"><IdCard size={19} aria-hidden /></span><div><dt>Student ID</dt><dd>{p.studentCode}</dd></div></div>
                <div className="profile-info-item"><span className="profile-info-icon"><UsersRound size={19} aria-hidden /></span><div><dt>Class</dt><dd>Class {p.levelNumber}-{p.section}</dd></div></div>
                <div className="profile-info-item"><span className="profile-info-icon"><School size={19} aria-hidden /></span><div><dt>School</dt><dd>{p.schoolName}</dd></div></div>
              </dl>
            </Card>
            <Card className="profile-personalise-card" title={<><Settings size={19} aria-hidden /><span>Personalise</span></>}>
              <form onSubmit={submit} className="stack" noValidate>
                {save.isError && <InlineAlert>{save.error instanceof ApiError ? save.error.message : 'Could not save your profile.'}</InlineAlert>}
                {saved && !save.isPending && <InlineAlert tone="success">Your profile has been updated.</InlineAlert>}
                <FormField label="Display name" required error={err} hint="This is what you’ll see on your home page.">
                  <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
                </FormField>
                <fieldset className="avatar-picker">
                  <legend className="field__label">Avatar</legend>
                  <div className="avatar-picker__grid">
                    {AVATARS.map((a) => (
                      <label key={a.key} className={`avatar-option ${avatar === a.key ? 'is-selected' : ''}`}>
                        <input type="radio" name="avatar" value={a.key} checked={avatar === a.key} onChange={() => setAvatar(a.key)} className="sr-only" />
                        <span aria-hidden>{a.emoji}</span>
                        <span className="sr-only">{a.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="row">
                  <button type="submit" className="btn btn--mango" disabled={save.isPending}>
                    {save.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </Card>
            <Card className="profile-signout-card" title={<><ShieldCheck size={19} aria-hidden /><span>Sign out</span></>}>
              <p className="muted">Using a shared computer? Always sign out when you finish.</p>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut size={16} aria-hidden /> Sign out
              </button>
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}

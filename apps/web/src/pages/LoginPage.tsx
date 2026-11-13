import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ERROR_CODES } from '@mango/shared';
import { ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { homePathFor } from '../auth/guards';
import { FormField, EMAIL_RX } from '../components/Form';
import { InlineAlert } from '../components/Feedback';
import { Eye, EyeOff, UsersRound } from 'lucide-react';

export function validateLogin(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = 'Enter your email address';
  else if (!EMAIL_RX.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function validateStudentLogin(schoolCode: string, studentCode: string, pin: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!schoolCode.trim()) errors.schoolCode = 'Enter your school code';
  else if (schoolCode.trim().length < 2) errors.schoolCode = 'School code is too short';
  if (!studentCode.trim()) errors.studentCode = 'Enter your student ID';
  if (!pin) errors.pin = 'Enter your PIN';
  else if (pin.length < 4) errors.pin = 'Your PIN has at least 4 digits';
  return errors;
}

type Mode = 'staff' | 'student';

function loginErrorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === ERROR_CODES.FORBIDDEN) return e.message;
    if (e.code === ERROR_CODES.INVALID_CREDENTIALS) return e.message === 'Invalid credentials' ? 'Incorrect email or password.' : e.message;
    if (e.code === ERROR_CODES.VALIDATION_ERROR) return 'Please check the details you entered.';
    if (e.code === ERROR_CODES.ACCOUNT_INACTIVE) return 'This account is inactive. Contact your administrator.';
    if (e.code === ERROR_CODES.RATE_LIMITED) return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }
  return errorMessage(e);
}

export function LoginPage() {
  const { login, studentLogin, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('staff');
  const [schoolCode, setSchoolCode] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated' && user) {
    return <Navigate to={homePathFor(user.role) ?? '/unsupported'} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const v = mode === 'staff' ? validateLogin(email, password) : validateStudentLogin(schoolCode, studentCode, pin);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const u =
        mode === 'staff'
          ? await login(email.trim(), password)
          : await studentLogin(schoolCode.trim().toUpperCase(), studentCode.trim().toUpperCase(), pin);
      const from = (location.state as { from?: string } | null)?.from;
      const home = homePathFor(u.role);
      navigate(from && home && from.startsWith(home) ? from : (home ?? '/unsupported'), { replace: true });
    } catch (err) {
      setFormError(loginErrorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero" aria-hidden="false">
        <div className="auth-brand" aria-label="Mango Dude AIGK">
          <svg className="auth-brand__mark" viewBox="0 0 88 82" role="img" aria-label="Mango and open book">
            <path d="M44 13c-3-6-2-10 3-12 2 5 2 9-1 13 8-8 16-10 25-8-5 9-13 13-25 11" fill="#b8df79" />
            <path d="M43 13c-14 2-25 17-26 33-1 10 4 19 13 22 8 3 15-2 17-11 3 9 10 14 18 11 9-3 14-12 13-22-1-16-12-31-26-33-4 0-6 1-9 3-3-2-5-3-9-3Z" fill="#ffc928" />
            <path d="M22 51c8-4 15-3 22 3 7-6 14-7 22-3l11 8c-12-2-23 0-33 8-10-8-21-10-33-8l11-8Z" fill="#fffdf5" />
            <path d="M11 61c12-2 23 1 33 8 10-7 21-10 33-8l-5 8c-10-1-19 1-28 8-9-7-18-9-28-8l-5-8Z" fill="#b8df79" />
            <path d="M44 54v15" stroke="#145c38" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="auth-brand__name">Mango Dude<span className="auth-brand__tag">AIGK</span></span>
        </div>
        <div className="auth-hero__content">
          <div className="auth-hero__copy">
            <h1>
              <span className="auth-hero__heading-line">Experiential learning,</span>
              <span className="highlight">managed beautifully.</span>
            </h1>
            <p>One place for platform owners, school administrators, teachers and students to run classes, activities, learning, quizzes, games, programmes and certification.</p>
          </div>
          <div className="auth-illustration" aria-hidden="true">
            <img src="/assets/mango-dude-illustration-transparent.png" alt="A mango above an open book, surrounded by learning icons" />
          </div>
        </div>
        <p className="auth-hero__note"><span className="auth-hero__note-icon"><UsersRound size={19} /></span><span className="auth-hero__note-divider" aria-hidden="true" /><span>Students: sign in with your school code, student ID and PIN from your teacher.</span></p>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit} noValidate aria-labelledby="login-title">
          <h2 id="login-title">Sign in</h2>
          <div className="seg" role="radiogroup" aria-label="Account type">
            {(
              [
                ['staff', 'Staff / Teacher'],
                ['student', 'Student'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={`seg__btn ${mode === m ? 'seg__btn--active' : ''}`}
                onClick={() => {
                  setMode(m);
                  setErrors({});
                  setFormError(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted">{mode === 'staff' ? 'Super Admin, School Admin and Teacher accounts.' : 'Use the details your school gave you.'}</p>
          {formError && <InlineAlert>{formError}</InlineAlert>}
          {mode === 'staff' ? (
            <>
              <FormField label="Email" error={errors.email} required>
                <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormField>
              <div className={`field ${errors.password ? 'field--error' : ''}`}>
                <label htmlFor="login-password" className="field__label">Password <span className="field__req" aria-hidden>*</span></label>
                <div className="auth-password">
                  <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? 'login-password-error' : undefined} aria-required="true" />
                  <button type="button" className="auth-password__toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                {errors.password && <p id="login-password-error" className="field__error" role="alert">{errors.password}</p>}
              </div>
            </>
          ) : (
            <>
              <FormField label="School code" error={errors.schoolCode} required hint="For example GVS001">
                <input autoComplete="organization" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} style={{ textTransform: 'uppercase' }} />
              </FormField>
              <FormField label="Student ID" error={errors.studentCode} required>
                <input autoComplete="username" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} style={{ textTransform: 'uppercase' }} />
              </FormField>
              <FormField label="PIN" error={errors.pin} required>
                <input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} />
              </FormField>
            </>
          )}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="auth-card__help">
            <a href="mailto:admin@mangodude.in">Need help signing in?</a>
          </p>
        </form>
      </section>
    </div>
  );
}

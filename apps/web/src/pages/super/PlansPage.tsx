import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, CheckCircle2, Crown, FlaskConical, GraduationCap, Layers, Pencil, PlusCircle, Users } from 'lucide-react';
import { CLASS_LEVELS, PROGRAMMES } from '@mango/shared';
import { ApiError, api, errorMessage } from '../../api/client';
import { useGet, useInvalidate } from '../../api/hooks';
import type { Plan } from '../../api/types';
import { DataTable } from '../../components/DataTable';
import { FormField, FormGrid } from '../../components/Form';
import { InlineAlert } from '../../components/Feedback';
import { Modal } from '../../components/Modal';
import { Badge, PremiumBadge, StatusBadge } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { num } from '../../lib/format';

const progName = (code: string) => PROGRAMMES.find((p) => p.code === code)?.name ?? code;

function planKey(name: string) {
  const k = name.toLowerCase();
  return k === 'premium' || k === 'pro' || k === 'basic' ? k : 'other';
}

function PlanIcon({ name }: { name: string }) {
  const k = planKey(name);
  if (k === 'premium') return <Crown size={18} />;
  if (k === 'pro') return <Award size={18} />;
  return <GraduationCap size={18} />;
}

export default function PlansPage() {
  const q = useGet<Plan[]>('/plans');
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Plan | 'new' | null>(params.get('new') === '1' ? 'new' : null);
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing('new');
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const plans = q.data;
  const totalPlans = plans?.length;
  const activePlans = plans?.filter((p) => p.status === 'active').length;
  const totalAssignments = plans?.reduce((sum, p) => sum + (p.activeSchools ?? 0), 0);

  return (
    <div className="plans-page">
      <div className="plans-head">
        <div className="plans-head__title">
          <span className="plans-head__icon" aria-hidden="true">
            <Layers size={26} />
          </span>
          <div>
            <h1>Subscription plans</h1>
            <p className="plans-head__sub">Plans define the class range and programmes a school receives when “apply plan entitlements” is used.</p>
          </div>
        </div>
        <div className="plans-head__side">
          <img className="plans-head__art" src="/plans-illustration.svg" alt="" aria-hidden="true" width="230" height="89" />
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <PlusCircle size={17} aria-hidden /> Create plan
          </button>
        </div>
      </div>

      <div className="plans-stats">
        <div className="plans-stat">
          <span className="plans-stat__icon plans-stat__icon--green" aria-hidden="true">
            <Layers size={22} />
          </span>
          <div>
            <p className="plans-stat__label">Total Plans</p>
            <p className="plans-stat__value">{totalPlans === undefined ? '–' : num(totalPlans)}</p>
          </div>
        </div>
        <div className="plans-stat plans-stat--mint">
          <span className="plans-stat__icon plans-stat__icon--mint" aria-hidden="true">
            <CheckCircle2 size={22} />
          </span>
          <div>
            <p className="plans-stat__label">Active Plans</p>
            <p className="plans-stat__value">{activePlans === undefined ? '–' : num(activePlans)}</p>
          </div>
        </div>
        <div className="plans-stat plans-stat--gold">
          <span className="plans-stat__icon plans-stat__icon--gold" aria-hidden="true">
            <Users size={22} />
          </span>
          <div>
            <p className="plans-stat__label">Total Active School Assignments</p>
            <p className="plans-stat__value">{totalAssignments === undefined ? '–' : num(totalAssignments)}</p>
          </div>
        </div>
      </div>

      <DataTable
        caption="Subscription plans"
        rows={plans}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        rowKey={(p) => p._id}
        emptyTitle="No plans yet"
        emptyMessage="Create a plan to start assigning subscriptions."
        rowClassName={(p) => `plan-row plan-row--${planKey(p.name)}`}
        columns={[
          {
            key: 'name',
            header: 'Plan',
            render: (p) => (
              <div className="plan-cell">
                <span className={`plan-cell__icon plan-cell__icon--${planKey(p.name)}`} aria-hidden="true">
                  <PlanIcon name={p.name} />
                </span>
                <div>
                  <strong>{p.name}</strong>
                  {p.description && <div className="muted small">{p.description}</div>}
                </div>
              </div>
            ),
          },
          { key: 'max', header: 'Classes', render: (p) => `1–${p.maxClassLevel}` },
          {
            key: 'programmes',
            header: 'Programmes',
            render: (p) =>
              p.programmeCodes.length ? (
                <div className="tag-list">
                  {p.programmeCodes.map((c) =>
                    PROGRAMMES.find((x) => x.code === c)?.premium ? (
                      <PremiumBadge key={c} label={progName(c)} />
                    ) : (
                      <Badge key={c} tone="green">
                        <FlaskConical size={12} aria-hidden /> {progName(c)}
                      </Badge>
                    ),
                  )}
                </div>
              ) : (
                <span className="muted">None</span>
              ),
          },
          { key: 'schools', header: 'Active schools', render: (p) => num(p.activeSchools) },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (p) => (
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(p)}>
                <Pencil size={13} aria-hidden /> Edit
              </button>
            ),
          },
        ]}
      />
      <PlanModal plan={editing === 'new' ? null : editing} open={editing !== null} onClose={() => setEditing(null)} />
    </div>
  );
}

function PlanModal({ plan, open, onClose }: { plan: Plan | null; open: boolean; onClose: () => void }) {
  const [f, setF] = useState({ name: '', description: '', maxClassLevel: 5, programmeCodes: [] as string[], status: 'active' as Plan['status'] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidate();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    setF(
      plan
        ? { name: plan.name, description: plan.description ?? '', maxClassLevel: plan.maxClassLevel, programmeCodes: plan.programmeCodes, status: plan.status }
        : { name: '', description: '', maxClassLevel: 5, programmeCodes: [], status: 'active' },
    );
    setErrors({});
    setFormError(null);
  }, [open, plan]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (f.name.trim().length < 2) v.name = 'Plan name is required (2–60 characters)';
    if (f.description.length > 500) v.description = 'Keep the description under 500 characters';
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const body = { ...f, name: f.name.trim() };
      if (plan) await api.patch(`/plans/${plan._id}`, body);
      else await api.post('/plans', body);
      await invalidate('/plans');
      toast.success(plan ? 'Plan updated' : 'Plan created');
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const toggleProg = (code: string) =>
    setF((p) => ({ ...p, programmeCodes: p.programmeCodes.includes(code) ? p.programmeCodes.filter((c) => c !== code) : [...p.programmeCodes, code] }));

  return (
    <Modal
      open={open}
      title={plan ? `Edit plan: ${plan.name}` : 'Create plan'}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="plan-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : plan ? 'Save plan' : 'Create plan'}
          </button>
        </>
      }
    >
      <form id="plan-form" onSubmit={submit} noValidate>
        {formError && <InlineAlert>{formError}</InlineAlert>}
        {plan && (plan.activeSchools ?? 0) > 0 && (
          <InlineAlert tone="info">Changes apply to schools the next time plan entitlements are applied; existing school access is not changed automatically.</InlineAlert>
        )}
        <FormGrid>
          <FormField label="Name" error={errors.name} required>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Plan['status'] })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </FormField>
        </FormGrid>
        <FormField label="Description" error={errors.description}>
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} rows={2} />
        </FormField>
        <FormField label="Maximum class level" error={errors.maxClassLevel} hint="The plan grants Classes 1 up to this level." required>
          <select value={f.maxClassLevel} onChange={(e) => setF({ ...f, maxClassLevel: Number(e.target.value) })}>
            {CLASS_LEVELS.map((n) => (
              <option key={n} value={n}>
                Classes 1–{n}
              </option>
            ))}
          </select>
        </FormField>
        <fieldset className="field">
          <legend className="field__label">Programmes included</legend>
          <div className="premium-frame" style={{ padding: '8px 12px' }}>
            <p className="small muted" style={{ margin: '0 0 6px' }}>
              Premium academies
            </p>
            {PROGRAMMES.filter((p) => p.premium).map((p) => (
              <label key={p.code} className="row" style={{ padding: '3px 0' }}>
                <input type="checkbox" checked={f.programmeCodes.includes(p.code)} onChange={() => toggleProg(p.code)} /> {p.name}
              </label>
            ))}
          </div>
          <div style={{ padding: '8px 12px' }}>
            {PROGRAMMES.filter((p) => !p.premium).map((p) => (
              <label key={p.code} className="row" style={{ padding: '3px 0' }}>
                <input type="checkbox" checked={f.programmeCodes.includes(p.code)} onChange={() => toggleProg(p.code)} /> {p.name}
              </label>
            ))}
          </div>
          {errors.programmeCodes && <p className="field__error">{errors.programmeCodes}</p>}
        </fieldset>
      </form>
    </Modal>
  );
}

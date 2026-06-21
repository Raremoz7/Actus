import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import { useAcademyMembers } from '../../hooks/useAcademy';
import {
  useCommissionEntries,
  useCommissionReport,
  useCommissionRules,
  useCreateCommissionEntry,
  useDeleteCommissionEntry,
  useSetCommissionRule,
  useSetPayout,
  type CommissionRuleType,
} from '../../hooks/useCommissions';
import { currentPeriod, formatBRL, parseBRLToCents, ruleTypeLabel } from '../../lib/commission';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';
const inputClass =
  'rounded-xl border border-outline-v bg-surface-1 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-neon';

type TabKey = 'report' | 'rules' | 'entries';

export function AcademyCommissionsPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [tab, setTab] = useState<TabKey>('report');
  const { data: members = [] } = useAcademyMembers('active');
  const instructors = useMemo(() => members.filter((m) => m.role === 'instructor'), [members]);

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center justify-between border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">Comissões</h1>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Competência</span>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-2">
          {(
            [
              ['report', 'Relatório'],
              ['rules', 'Regras'],
              ['entries', 'Lançamentos'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                tab === key ? 'bg-neon/15 text-neon' : 'text-text-3 hover:text-text-1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'report' && <ReportTab period={period} />}
        {tab === 'rules' && <RulesTab instructors={instructors} />}
        {tab === 'entries' && <EntriesTab period={period} instructors={instructors} />}
      </div>
    </div>
  );
}

type InstructorOption = { user_id: string; display_name: string | null };

function ReportTab({ period }: { period: string }) {
  const { data, isLoading } = useCommissionReport(period);
  const setPayout = useSetPayout();
  const { toast } = useToast();
  const rows = data?.rows ?? [];

  async function togglePaid(instructorId: string, current: 'pending' | 'paid', commissionCents: number) {
    const next = current === 'paid' ? 'pending' : 'paid';
    try {
      await setPayout.mutateAsync({
        instructor_user_id: instructorId,
        period,
        status: next,
        amount_cents: commissionCents,
      });
      toast(next === 'paid' ? 'Comissão marcada como paga.' : 'Comissão reaberta.');
    } catch {
      toast('Não foi possível atualizar o pagamento.', 'error');
    }
  }

  return (
    <Card>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-3">Nenhum instrutor ativo para esta competência.</p>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-v text-left">
                <th className={thClass}>Instrutor</th>
                <th className={thClass}>Alunos</th>
                <th className={thClass}>Regra</th>
                <th className={thClass}>Base</th>
                <th className={thClass}>Comissão</th>
                <th className={thClass}>Status</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.instructor_user_id} className="border-b border-outline-v/40">
                  <td className="py-2 text-sm text-text-1">{r.display_name ?? '—'}</td>
                  <td className="py-2 font-mono text-sm text-text-2">{r.student_count}</td>
                  <td className="py-2 text-xs text-text-3">
                    {r.rule_type ? ruleTypeLabel[r.rule_type] : 'Sem regra'}
                  </td>
                  <td className="py-2 font-mono text-sm text-text-2">{formatBRL(r.base_cents)}</td>
                  <td className="py-2 font-mono text-sm text-text-1">{formatBRL(r.commission_cents)}</td>
                  <td className="py-2">
                    <Tag variant={r.status === 'paid' ? 'active' : 'warn'}>
                      {r.status === 'paid' ? 'Pago' : 'A pagar'}
                    </Tag>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => togglePaid(r.instructor_user_id, r.status, r.commission_cents)}
                      className="text-xs text-text-3 hover:text-neon"
                    >
                      {r.status === 'paid' ? 'Reabrir' : 'Marcar pago'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && (
            <div className="mt-3 flex justify-end gap-6 border-t border-outline-v pt-3 font-mono text-sm">
              <span className="text-text-3">
                Base: <span className="text-text-2">{formatBRL(data.totals.base_cents)}</span>
              </span>
              <span className="text-text-3">
                A pagar: <span className="text-neon">{formatBRL(data.totals.due_cents)}</span>
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function RulesTab({ instructors }: { instructors: InstructorOption[] }) {
  const { data: rules = [], isLoading } = useCommissionRules();
  const setRule = useSetCommissionRule();
  const { toast } = useToast();

  const [target, setTarget] = useState<string>(''); // '' = padrão da academia
  const [ruleType, setRuleType] = useState<CommissionRuleType>('percent');
  const [value, setValue] = useState('');

  const nameById = useMemo(
    () => new Map(instructors.map((i) => [i.user_id, i.display_name])),
    [instructors],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = {
      instructor_user_id: target || null,
      rule_type: ruleType,
      percent: ruleType === 'percent' ? Number(value.replace(',', '.')) : null,
      amount_cents: ruleType === 'percent' ? null : parseBRLToCents(value),
    };
    try {
      await setRule.mutateAsync(body);
      toast('Regra salva.');
      setValue('');
    } catch {
      toast('Não foi possível salvar a regra.', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <Card className="xl:w-80">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">Definir regra</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Instrutor</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              <option value="">Padrão da academia</option>
              {instructors.map((i) => (
                <option key={i.user_id} value={i.user_id}>
                  {i.display_name ?? i.user_id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Tipo</span>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as CommissionRuleType)}
              className={inputClass}
            >
              <option value="percent">Percentual (%)</option>
              <option value="fixed_per_student">Fixo por aluno (R$)</option>
              <option value="fixed_monthly">Fixo mensal (R$)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">
              {ruleType === 'percent' ? 'Percentual' : 'Valor (R$)'}
            </span>
            <input
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={ruleType === 'percent' ? '10' : '50,00'}
              className={inputClass}
            />
          </label>
          <Button type="submit" disabled={setRule.isPending}>
            {setRule.isPending ? 'Salvando…' : 'Salvar regra'}
          </Button>
        </form>
      </Card>

      <Card className="flex-1">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">Regras vigentes</h2>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : rules.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">Nenhuma regra definida.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-v text-left">
                <th className={thClass}>Escopo</th>
                <th className={thClass}>Tipo</th>
                <th className={thClass}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-outline-v/40">
                  <td className="py-2 text-sm text-text-1">
                    {r.instructor_user_id ? nameById.get(r.instructor_user_id) ?? '—' : 'Padrão da academia'}
                  </td>
                  <td className="py-2 text-xs text-text-3">{ruleTypeLabel[r.rule_type]}</td>
                  <td className="py-2 font-mono text-sm text-text-2">
                    {r.rule_type === 'percent'
                      ? `${r.percent ?? 0}%`
                      : formatBRL(r.amount_cents ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function EntriesTab({ period, instructors }: { period: string; instructors: InstructorOption[] }) {
  const { data: entries = [], isLoading } = useCommissionEntries(period);
  const createEntry = useCreateCommissionEntry();
  const deleteEntry = useDeleteCommissionEntry();
  const { toast } = useToast();

  const [instructorId, setInstructorId] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!instructorId) {
      toast('Selecione um instrutor.', 'error');
      return;
    }
    try {
      await createEntry.mutateAsync({
        instructor_user_id: instructorId,
        period,
        amount_cents: parseBRLToCents(value),
        note: note || undefined,
      });
      toast('Lançamento adicionado.');
      setValue('');
      setNote('');
    } catch {
      toast('Não foi possível lançar o valor.', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <Card className="xl:w-80">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">Lançar valor</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Instrutor</span>
            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={inputClass}>
              <option value="">Selecione…</option>
              {instructors.map((i) => (
                <option key={i.user_id} value={i.user_id}>
                  {i.display_name ?? i.user_id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Valor (R$)</span>
            <input required value={value} onChange={(e) => setValue(e.target.value)} placeholder="1.000,00" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">Observação</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="opcional" className={inputClass} />
          </label>
          <Button type="submit" disabled={createEntry.isPending}>
            {createEntry.isPending ? 'Lançando…' : 'Lançar'}
          </Button>
          <p className="text-xs text-text-3">
            Base manual da competência. Quando o módulo financeiro entrar, os valores virão da cobrança automaticamente.
          </p>
        </form>
      </Card>

      <Card className="flex-1">
        <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">Lançamentos</h2>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">Nenhum lançamento nesta competência.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-v text-left">
                <th className={thClass}>Instrutor</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Observação</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-outline-v/40">
                  <td className="py-2 text-sm text-text-1">{e.instructor_name ?? '—'}</td>
                  <td className="py-2 font-mono text-sm text-text-2">{formatBRL(e.amount_cents)}</td>
                  <td className="py-2 text-xs text-text-3">{e.note ?? '—'}</td>
                  <td className="py-2 text-right">
                    {e.source === 'manual' && (
                      <button
                        type="button"
                        onClick={() => deleteEntry.mutate(e.id)}
                        className="text-xs text-text-3 hover:text-error"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

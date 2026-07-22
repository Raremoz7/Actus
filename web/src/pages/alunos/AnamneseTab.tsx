import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Skeleton } from '../../components/ui/Skeleton';
import { AnamneseBuilder } from '../anamnese/AnamneseBuilder';
import {
  useAnamneseTemplates,
  useSaveStudentAnamnese,
  useStudentAnamnese,
} from '../../hooks/useAnamnese';
import type { AnamneseAnswerValue, AnamneseField, AnamneseTemplate } from '../../lib/schemas';

const FIELD =
  'mt-1 h-9 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 focus:border-neon focus:outline-none';

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: AnamneseField;
  value: AnamneseAnswerValue;
  onChange: (v: AnamneseAnswerValue) => void;
}) {
  const str = value == null ? '' : String(value);
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-xl border border-outline-v bg-surface-1 px-3 py-2 text-sm text-text-1 focus:border-neon focus:outline-none"
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          className={FIELD}
          inputMode="decimal"
          value={str}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );
    case 'date':
      return <input type="date" className={FIELD} value={str} onChange={(e) => onChange(e.target.value)} />;
    case 'boolean':
      return (
        <select
          className={FIELD}
          value={value === true ? 'sim' : value === false ? 'nao' : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'sim')}
        >
          <option value="">—</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      );
    case 'select':
      return (
        <select className={FIELD} value={str} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    default:
      return <input className={FIELD} value={str} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function AnamneseTab({ studentId }: { studentId: string }) {
  const anamnese = useStudentAnamnese(studentId);
  const templates = useAnamneseTemplates();
  const save = useSaveStudentAnamnese(studentId);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnamneseAnswerValue> | null>(null);

  // Template ativo: o que veio na resposta do aluno, senão o primeiro template ativo do profissional.
  const template: AnamneseTemplate | null = useMemo(() => {
    if (anamnese.data?.template) return anamnese.data.template;
    return templates.data?.find((t) => t.is_active) ?? templates.data?.[0] ?? null;
  }, [anamnese.data?.template, templates.data]);

  // Estado local de respostas inicializa a partir do servidor (chave por template para resetar ao trocar).
  const serverAnswers = anamnese.data?.answers ?? null;
  const current = answers ?? serverAnswers ?? {};

  if (anamnese.isLoading) return <Skeleton className="h-40 w-full" />;

  if (!template) {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <p className="text-sm text-text-3">
          Nenhuma anamnese configurada. Crie um formulário personalizado para seus alunos.
        </p>
        <Button variant="primary" className="!px-4 !py-1.5 !text-xs" onClick={() => setBuilderOpen(true)}>
          Criar anamnese
        </Button>
        <AnamneseBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} template={null} />
      </div>
    );
  }

  function setValue(key: string, v: AnamneseAnswerValue) {
    setAnswers({ ...current, [key]: v });
  }

  function submit() {
    if (!template) return;
    save.mutate({ template_id: template.id, answers: current }, { onSuccess: () => setAnswers(null) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
          {template.name}
        </h3>
        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={() => setBuilderOpen(true)}>
          Editar Anamnese
        </Button>
      </div>

      {template.fields.length === 0 ? (
        <p className="text-sm text-text-3">Este formulário ainda não tem perguntas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {template.fields.map((f) => (
            <label key={f.key} className="block">
              <Eyebrow>
                {f.label}
                {f.required ? ' *' : ''}
              </Eyebrow>
              <FieldInput field={f} value={current[f.key] ?? null} onChange={(v) => setValue(f.key, v)} />
            </label>
          ))}
        </div>
      )}

      <Card className="!p-3 text-xs text-text-3">
        Respostas visíveis para o profissional vinculado. Distinto do PAR-Q (questionário fixo de
        prontidão).
      </Card>

      <div className="flex items-center justify-end gap-2">
        {anamnese.data?.submitted_at && (
          <span className="font-mono text-[10px] text-text-3">
            Atualizado em {new Date(anamnese.data.submitted_at).toLocaleDateString('pt-BR')}
          </span>
        )}
        <Button
          variant="primary"
          className="!px-4 !py-1.5 !text-xs"
          onClick={submit}
          disabled={save.isPending || answers === null}
        >
          {save.isPending ? 'Salvando…' : 'Salvar respostas'}
        </Button>
      </div>

      <AnamneseBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} template={template} />
    </div>
  );
}

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  useCreateAnamneseTemplate,
  useUpdateAnamneseTemplate,
  type TemplateInput,
} from '../../hooks/useAnamnese';
import type { AnamneseField, AnamneseFieldTypeT, AnamneseTemplate } from '../../lib/schemas';

const FIELD =
  'h-9 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 focus:border-neon focus:outline-none';

const TYPE_LABELS: Record<AnamneseFieldTypeT, string> = {
  text: 'Texto',
  textarea: 'Texto longo',
  number: 'Número',
  select: 'Escolha',
  boolean: 'Sim/Não',
  date: 'Data',
};

// Gera uma key estável a partir do label (não usa Date/Math.random — determinístico).
function keyFromLabel(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base ? `${base}_${index}` : `campo_${index}`;
}

function emptyField(index: number): AnamneseField {
  return { key: `campo_${index}`, label: '', type: 'text', required: false };
}

export function AnamneseBuilder({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: AnamneseTemplate | null;
}) {
  const [name, setName] = useState(template?.name ?? 'Anamnese');
  const [fields, setFields] = useState<AnamneseField[]>(template?.fields ?? [emptyField(0)]);
  const create = useCreateAnamneseTemplate();
  const update = useUpdateAnamneseTemplate(template?.id ?? '');
  const pending = create.isPending || update.isPending;

  function patchField(i: number, patch: Partial<AnamneseField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function move(i: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function remove(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setFields((prev) => [...prev, emptyField(prev.length)]);
  }

  function submit() {
    const cleaned: AnamneseField[] = fields
      .filter((f) => f.label.trim() !== '')
      .map((f, i) => ({
        ...f,
        key: keyFromLabel(f.label, i),
        label: f.label.trim(),
        options:
          f.type === 'select'
            ? (f.options ?? []).map((o) => o.trim()).filter((o) => o !== '')
            : undefined,
      }));
    const payload: TemplateInput = { name: name.trim() || 'Anamnese', fields: cleaned };
    const onSuccess = () => onClose();
    if (template) update.mutate(payload, { onSuccess });
    else create.mutate(payload, { onSuccess });
  }

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Editar anamnese' : 'Criar anamnese'} size="xl">
      <div className="flex flex-col gap-4">
        <Input label="Nome do formulário" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="flex flex-col gap-3">
          {fields.map((f, i) => (
            <Card key={i} className="flex flex-col gap-2 !p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label="Pergunta"
                    value={f.label}
                    placeholder="Ex.: Possui alguma lesão?"
                    onChange={(e) => patchField(i, { label: e.target.value })}
                  />
                </div>
                <label className="w-32">
                  <Eyebrow>Tipo</Eyebrow>
                  <select
                    className={`${FIELD} mt-1`}
                    value={f.type}
                    onChange={(e) =>
                      patchField(i, { type: e.target.value as AnamneseFieldTypeT })
                    }
                  >
                    {(Object.keys(TYPE_LABELS) as AnamneseFieldTypeT[]).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 pb-2 text-xs text-text-2">
                  <input
                    type="checkbox"
                    checked={f.required ?? false}
                    onChange={(e) => patchField(i, { required: e.target.checked })}
                  />
                  Obrigatório
                </label>
              </div>

              {f.type === 'select' && (
                <label className="block">
                  <Eyebrow>Opções (uma por linha)</Eyebrow>
                  <textarea
                    className="mt-1 min-h-[64px] w-full rounded-xl border border-outline-v bg-surface-1 px-3 py-2 text-sm text-text-1 focus:border-neon focus:outline-none"
                    value={(f.options ?? []).join('\n')}
                    onChange={(e) =>
                      patchField(i, { options: e.target.value.split('\n') })
                    }
                  />
                </label>
              )}

              <div className="flex items-center justify-end gap-2 text-xs">
                <button type="button" className="text-text-3 hover:text-neon" onClick={() => move(i, -1)} aria-label="Mover para cima">
                  ↑
                </button>
                <button type="button" className="text-text-3 hover:text-neon" onClick={() => move(i, 1)} aria-label="Mover para baixo">
                  ↓
                </button>
                <button type="button" className="text-text-3 hover:text-error" onClick={() => remove(i)}>
                  Remover
                </button>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs self-start" onClick={add}>
          + Adicionar pergunta
        </Button>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="!px-4 !py-1.5 !text-xs"
            onClick={submit}
            disabled={pending || fields.every((f) => f.label.trim() === '')}
          >
            {pending ? 'Salvando…' : 'Salvar anamnese'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

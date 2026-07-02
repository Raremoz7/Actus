import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useUpdateStudent, type EditStudentInput } from '../../hooks/useStudentProfile';
import type { Student } from '../../lib/schemas';

const FIELD =
  'mt-1 h-9 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 focus:border-neon focus:outline-none';
const LABEL = 'text-[10px] uppercase tracking-wider text-text-3';

export function EditStudentModal({
  student,
  open,
  onClose,
}: {
  student: Student;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateStudent(student.id);
  const [fullName, setFullName] = useState(student.full_name ?? '');
  const [phone, setPhone] = useState(student.phone ?? '');
  const [gender, setGender] = useState(student.gender ?? 'nao_informar');
  const [birth, setBirth] = useState(student.birth_date ?? '');
  const [weight, setWeight] = useState(
    student.body_weight_kg != null ? String(student.body_weight_kg) : '',
  );
  const [height, setHeight] = useState(
    student.height_cm != null ? String(student.height_cm) : '',
  );

  function submit() {
    const input: EditStudentInput = {
      full_name: fullName.trim() || undefined,
      phone: phone.trim() === '' ? null : phone.trim(),
      gender,
      birth_date: birth || undefined,
      body_weight_kg: weight === '' ? null : Number(weight),
      height_cm: height === '' ? null : Number(height),
    };
    update.mutate(input, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar dados do aluno">
      <div className="flex flex-col gap-3">
        <label>
          <span className={LABEL}>Nome</span>
          <input className={FIELD} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          <span className={LABEL}>Telefone</span>
          <input className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          <span className={LABEL}>Gênero</span>
          <select
            className={FIELD}
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
          >
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="nao_informar">Não informar</option>
          </select>
        </label>
        <label>
          <span className={LABEL}>Nascimento</span>
          <input
            type="date"
            className={FIELD}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </label>
        <div className="flex gap-3">
          <label className="flex-1">
            <span className={LABEL}>Peso (kg)</span>
            <input
              className={FIELD}
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <label className="flex-1">
            <span className={LABEL}>Altura (cm)</span>
            <input
              className={FIELD}
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="!px-4 !py-1.5 !text-xs"
            onClick={submit}
            disabled={update.isPending}
          >
            {update.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

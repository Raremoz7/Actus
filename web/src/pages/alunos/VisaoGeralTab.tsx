import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Tag } from '../../components/ui/Tag';
import type { Student } from '../../lib/schemas';
import { ageFromBirthDate } from '../../lib/studentStatus';

const GENDER_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  nao_informar: 'Não informado',
  outro: 'Outro',
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="!p-3">
      <div className="text-[9px] uppercase tracking-wider text-text-3">{label}</div>
      <div className="font-mono text-lg text-text-1">{value}</div>
    </Card>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-outline-v py-2 last:border-0">
      <Eyebrow>{label}</Eyebrow>
      <span className="text-sm text-text-1">{value}</span>
    </div>
  );
}

export function VisaoGeralTab({
  student,
  archived,
  onEdit,
  onToggleStatus,
}: {
  student: Student;
  archived: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const age = ageFromBirthDate(student.birth_date);
  const memberSince = student.linked_at
    ? new Date(student.linked_at).toLocaleDateString('pt-BR')
    : '—';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={student.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-black uppercase tracking-wide text-text-1">
            {student.full_name ?? student.email}
          </h2>
          <Tag variant={archived ? 'default' : 'active'}>{archived ? 'Arquivado' : 'Ativo'}</Tag>
        </div>
        <Button variant="primary" className="!px-4 !py-1.5 !text-xs" onClick={onEdit}>
          Editar dados
        </Button>
        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onToggleStatus}>
          {archived ? 'Reativar' : 'Desativar'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Idade" value={age == null ? '—' : `${age}`} />
        <Metric
          label="Peso"
          value={student.body_weight_kg == null ? '—' : `${student.body_weight_kg} kg`}
        />
        <Metric
          label="Altura"
          value={student.height_cm == null ? '—' : `${(student.height_cm / 100).toFixed(2)} m`}
        />
        <Metric label="Membro desde" value={memberSince} />
      </div>

      <Card>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-neon">Contato</div>
        <ContactRow label="Telefone" value={student.phone ?? '—'} />
        <ContactRow label="Gênero" value={student.gender ? GENDER_LABEL[student.gender] : '—'} />
        <ContactRow label="E-mail" value={student.email} />
      </Card>
    </div>
  );
}

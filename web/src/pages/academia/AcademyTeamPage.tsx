import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import {
  useAcademyMembers,
  useAddInstructor,
  useRemoveInstructor,
  useUpdateMemberStatus,
  type MemberStatusFilter,
} from '../../hooks/useAcademy';

const inputClass =
  'w-full rounded-xl border border-outline-v bg-surface-1 px-4 py-3 text-text-1 placeholder:text-text-3 outline-none focus:border-neon';

const addErrorLabel: Record<string, string> = {
  personal_not_found: 'Nenhum personal encontrado com esse email.',
  not_a_personal: 'Esse usuário não é um personal.',
  already_instructor_elsewhere: 'Esse personal já é instrutor ativo em outra academia.',
};

export function AcademyTeamPage() {
  const [filter, setFilter] = useState<MemberStatusFilter>('active');
  const { data: members = [], isLoading } = useAcademyMembers(filter);
  const instructors = members.filter((m) => m.role === 'instructor');

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const addInstructor = useAddInstructor();
  const removeInstructor = useRemoveInstructor();
  const updateStatus = useUpdateMemberStatus();
  const { toast } = useToast();

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await addInstructor.mutateAsync(email.trim());
      toast('Instrutor vinculado.');
      setEmail('');
      setModalOpen(false);
    } catch (err) {
      const code = axios.isAxiosError(err) ? (err.response?.data?.error as string | undefined) : undefined;
      toast(addErrorLabel[code ?? ''] ?? 'Não foi possível vincular o instrutor.', 'error');
    }
  }

  return (
    <div className="flex-1">
      <PageHeader
        title="Equipe"
        actions={<Button onClick={() => setModalOpen(true)}>Adicionar instrutor</Button>}
      />

      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-2">
          {(['active', 'revoked'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                filter === f ? 'bg-neon/15 text-neon' : 'text-text-3 hover:text-text-1'
              }`}
            >
              {f === 'active' ? 'Ativos' : 'Revogados'}
            </button>
          ))}
        </div>

        <Card>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">
              {filter === 'active' ? 'Nenhum instrutor ativo. Adicione um pelo email.' : 'Nenhum instrutor revogado.'}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <Eyebrow as="th" className="py-2 font-normal">Instrutor</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal">Email</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal">Alunos</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal">Status</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {instructors.map((m) => (
                  <tr key={m.user_id} className="border-b border-outline-v/40">
                    <td className="py-2">
                      <Link
                        to={`/app/academia/equipe/${m.user_id}`}
                        className="text-sm text-text-1 hover:text-neon"
                      >
                        {m.display_name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2 text-sm text-text-2">{m.email}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{m.student_count}</td>
                    <td className="py-2">
                      <Tag variant={m.status === 'active' ? 'active' : 'default'}>
                        {m.status === 'active' ? 'Ativo' : 'Revogado'}
                      </Tag>
                    </td>
                    <td className="py-2 text-right">
                      {m.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => removeInstructor.mutate(m.user_id)}
                          className="text-xs text-text-3 hover:text-error"
                        >
                          Revogar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ userId: m.user_id, status: 'active' })}
                          className="text-xs text-text-3 hover:text-neon"
                        >
                          Reativar
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar instrutor">
        <form onSubmit={onAdd} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-text-3">
              Email do personal
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="personal@exemplo.com"
              className={inputClass}
            />
          </label>
          <p className="text-xs text-text-3">
            O personal precisa já ter conta no Actus. Ele mantém seus alunos; a academia passa a vê-los no agregado.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addInstructor.isPending}>
              {addInstructor.isPending ? 'Vinculando…' : 'Vincular'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import axios, { type AxiosError } from 'axios';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import { usePatchStaff, useStaff } from '../../hooks/useAdmin';
import type { StaffMember } from '../../lib/schemas';

const inputClass =
  'h-9 w-full rounded-xl border border-outline-v bg-surface-2 px-3 text-sm text-text-1 focus:border-neon focus:outline-none';
const labelClass = 'mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-3';

const thClass =
  'px-4 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-text-3';

export function StaffPage() {
  const staffQuery = useStaff();
  const [editing, setEditing] = useState<StaffMember | null>(null);

  return (
    <>
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Equipe
        </h1>
      </div>
      <div className="p-6">
        {staffQuery.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (staffQuery.data ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm text-text-3">Nenhum membro de equipe.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-v">
            <table className="w-full bg-surface-1 text-sm">
              <thead className="border-b border-outline-v">
                <tr>
                  <th className={thClass}>Nome</th>
                  <th className={thClass}>E-mail</th>
                  <th className={thClass}>Papéis</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {(staffQuery.data ?? []).map((member) => (
                  <tr key={member.id} className="border-b border-outline-v last:border-0">
                    <td className="px-4 py-3 text-text-1">{member.display_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2">{member.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {member.staff_roles.map((role) => (
                          <Tag key={role} variant={role === 'actus_admin' ? 'active' : 'default'}>
                            {role.replace('actus_', '')}
                          </Tag>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => setEditing(member)}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <EditStaffModal member={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditStaffModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const { toast } = useToast();
  const patchStaff = usePatchStaff();
  const [displayName, setDisplayName] = useState(member.display_name ?? '');
  const [email, setEmail] = useState(member.email);
  const [isAdmin, setIsAdmin] = useState(member.staff_roles.includes('actus_admin'));
  const [isSuporte, setIsSuporte] = useState(member.staff_roles.includes('actus_suporte'));
  const [mustChange, setMustChange] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const staffRoles = [
      ...(isAdmin ? (['actus_admin'] as const) : []),
      ...(isSuporte ? (['actus_suporte'] as const) : []),
    ];
    if (staffRoles.length === 0) {
      setError('O membro precisa de pelo menos um papel.');
      return;
    }
    patchStaff.mutate(
      {
        userId: member.id,
        body: {
          ...(displayName.trim() !== (member.display_name ?? '')
            ? { display_name: displayName.trim() }
            : {}),
          ...(email.trim() !== member.email ? { email: email.trim() } : {}),
          staff_roles: staffRoles,
          ...(mustChange ? { must_change_password: true } : {}),
        },
      },
      {
        onSuccess: () => {
          toast('Membro atualizado.');
          onClose();
        },
        onError: (err) => {
          const branch = axios.isAxiosError(err)
            ? (err as AxiosError<{ error?: string }>).response?.data?.error
            : undefined;
          if (branch === 'last_actus_admin') setError('Não dá para remover o último admin.');
          else if (branch === 'email_already_in_use') setError('Este e-mail já está em uso.');
          else if (branch === 'forbidden') setError('Sem permissão para esta alteração.');
          else setError('Não foi possível salvar. Tente de novo.');
        },
      },
    );
  }

  return (
    <Modal open onClose={onClose} title="Editar membro">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="staff-name" className={labelClass}>
            Nome de exibição
          </label>
          <input
            id="staff-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="staff-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <fieldset>
          <legend className={labelClass}>Papéis</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-text-1">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="accent-[var(--color-neon)]"
              />
              Admin
            </label>
            <label className="flex items-center gap-2 text-sm text-text-1">
              <input
                type="checkbox"
                checked={isSuporte}
                onChange={(e) => setIsSuporte(e.target.checked)}
                className="accent-[var(--color-neon)]"
              />
              Suporte
            </label>
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm text-text-1">
          <input
            type="checkbox"
            checked={mustChange}
            onChange={(e) => setMustChange(e.target.checked)}
            className="accent-[var(--color-neon)]"
          />
          Exigir troca de senha no próximo acesso
        </label>
        {error && <p className="text-xs text-error">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" type="button" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="!px-4 !py-1.5 !text-xs" disabled={patchStaff.isPending}>
            {patchStaff.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

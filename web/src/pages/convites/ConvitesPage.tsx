import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import { Sidebar, type SidebarSection } from '../../layouts/Sidebar';
import {
  deriveInviteStatus,
  useCreateInvite,
  useInvites,
  useRevokeInvite,
  type InviteStatus,
} from '../../hooks/useInvites';
import type { Invite } from '../../lib/schemas';

type FilterKey = 'todos' | InviteStatus;

const filterLabels: Record<FilterKey, string> = {
  todos: 'Todos',
  pendente: 'Pendentes',
  aceito: 'Aceitos',
  expirado: 'Expirados',
};

const statusTone: Record<InviteStatus, 'default' | 'active' | 'warn' | 'error'> = {
  pendente: 'active',
  aceito: 'default',
  expirado: 'warn',
};

function inviteLink(code: string): string {
  return `${window.location.origin}/convite/${code}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function ConvitesPage() {
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Invite | null>(null);
  const { toast } = useToast();

  const invitesQuery = useInvites();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const invites = useMemo(() => invitesQuery.data ?? [], [invitesQuery.data]);
  const withStatus = useMemo(
    () => invites.map((invite) => ({ invite, status: deriveInviteStatus(invite) })),
    [invites],
  );

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { todos: withStatus.length, pendente: 0, aceito: 0, expirado: 0 };
    for (const { status } of withStatus) c[status] += 1;
    return c;
  }, [withStatus]);

  const visible = withStatus.filter(({ status }) => filter === 'todos' || status === filter);

  const sections: SidebarSection[] = [
    {
      label: 'Status',
      items: (Object.keys(filterLabels) as FilterKey[]).map((key) => ({
        name: filterLabels[key],
        count: counts[key],
        active: filter === key,
        onClick: () => setFilter(key),
      })),
    },
  ];

  function handleCreate() {
    createInvite.mutate(undefined, {
      onSuccess: (invite) => setCreatedCode(invite.code),
      onError: () => toast('Não foi possível gerar o convite.', 'error'),
    });
  }

  function handleCopy(code: string) {
    void navigator.clipboard.writeText(inviteLink(code)).then(
      () => toast('Link copiado.'),
      () => toast('Não foi possível copiar o link.', 'error'),
    );
  }

  function handleRevoke() {
    if (!revoking) return;
    revokeInvite.mutate(revoking.id, {
      onSuccess: () => toast('Convite revogado.'),
      onError: () => toast('Não foi possível revogar o convite.', 'error'),
      onSettled: () => setRevoking(null),
    });
  }

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex-1">
        <PageHeader
          title="Convites"
          actions={
            <Button
              className="!px-4 !py-1.5 !text-xs"
              onClick={handleCreate}
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? 'Gerando…' : 'Gerar convite'}
            </Button>
          }
        />

        <div className="flex flex-col gap-2 p-6">
          {invitesQuery.isLoading ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : invites.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
                Nenhum convite ainda.
              </p>
              <p className="mt-1 text-sm text-text-3">
                Gere um convite e envie o link para o aluno.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-3">
              Nenhum convite corresponde ao filtro.
            </p>
          ) : (
            visible.map(({ invite, status }) => (
              <Card key={invite.id} className="flex items-center gap-4">
                <span className="font-mono text-sm text-text-1">{invite.code}</span>
                <Tag variant={statusTone[status]}>{status}</Tag>
                <span className="text-xs text-text-3">
                  criado em {formatDate(invite.created_at)} · expira em{' '}
                  {formatDate(invite.expires_at)} · usos {invite.used_count}/{invite.max_uses}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {status === 'pendente' && (
                    <>
                      <Button
                        variant="ghost"
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => handleCopy(invite.code)}
                      >
                        Copiar link
                      </Button>
                      <Button
                        variant="ghost"
                        className="!px-3 !py-1 !text-xs !text-error hover:!text-error"
                        onClick={() => setRevoking(invite)}
                      >
                        Revogar
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={createdCode !== null} onClose={() => setCreatedCode(null)} title="Convite gerado">
        {createdCode && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-2">
              Envie o código ou o link para o aluno. Vale por 7 dias, um uso.
            </p>
            <p className="rounded-xl border border-outline-v bg-surface-2 px-4 py-3 text-center font-mono text-lg text-neon">
              {createdCode}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={() => setCreatedCode(null)}>
                Fechar
              </Button>
              <Button className="!px-4 !py-1.5 !text-xs" onClick={() => handleCopy(createdCode)}>
                Copiar link
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={revoking !== null} onClose={() => setRevoking(null)} title="Revogar convite">
        {revoking && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-2">
              O convite <span className="font-mono text-text-1">{revoking.code}</span> expira
              imediatamente e deixa de aceitar novos vínculos.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={() => setRevoking(null)}>
                Cancelar
              </Button>
              <Button
                className="!bg-error !px-4 !py-1.5 !text-xs !text-text-inv"
                onClick={handleRevoke}
                disabled={revokeInvite.isPending}
              >
                {revokeInvite.isPending ? 'Revogando…' : 'Revogar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

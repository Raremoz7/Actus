import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import { usePatchStudentLink, useStudentLinks, type LinkStatus } from '../../hooks/useAdmin';
import type { StudentLink } from '../../lib/schemas';

const thClass =
  'px-4 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-text-3';

const statusLabels: Record<LinkStatus, string> = {
  active: 'Ativos',
  revoked: 'Desativados',
};

export function VinculosPage() {
  const [status, setStatus] = useState<LinkStatus>('active');
  const [confirming, setConfirming] = useState<StudentLink | null>(null);
  const { toast } = useToast();

  const linksQuery = useStudentLinks(status);
  const patchLink = usePatchStudentLink();

  function handleToggle() {
    if (!confirming) return;
    const next: LinkStatus = confirming.status === 'active' ? 'revoked' : 'active';
    patchLink.mutate(
      { linkId: confirming.id, status: next },
      {
        onSuccess: () => toast(next === 'active' ? 'Vínculo reativado.' : 'Vínculo desativado.'),
        onError: () =>
          toast('Não foi possível alterar o vínculo. Pode haver outro ativo para o mesmo papel.', 'error'),
        onSettled: () => setConfirming(null),
      },
    );
  }

  return (
    <>
      <div className="flex h-[52px] items-center gap-4 border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Vínculos
        </h1>
        <div className="ml-auto flex gap-1">
          {(Object.keys(statusLabels) as LinkStatus[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                status === key ? 'bg-neon/10 text-neon' : 'text-text-3 hover:text-text-1'
              }`}
            >
              {statusLabels[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        {linksQuery.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (linksQuery.data ?? []).length === 0 ? (
          <p className="py-12 text-center text-sm text-text-3">
            Nenhum vínculo {status === 'active' ? 'ativo' : 'desativado'}.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-v">
            <table className="w-full bg-surface-1 text-sm">
              <thead className="border-b border-outline-v">
                <tr>
                  <th className={thClass}>Aluno</th>
                  <th className={thClass}>Profissional</th>
                  <th className={thClass}>Papel</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Vinculado em</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {(linksQuery.data ?? []).map((link) => (
                  <tr key={link.id} className="border-b border-outline-v last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-text-1">{link.student.full_name ?? '—'}</p>
                      <p className="font-mono text-xs text-text-3">{link.student.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-1">{link.professional.display_name ?? '—'}</p>
                      <p className="font-mono text-xs text-text-3">{link.professional.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Tag>{link.professional_role}</Tag>
                    </td>
                    <td className="px-4 py-3">
                      <Tag variant={link.status === 'active' ? 'active' : 'error'}>
                        {link.status === 'active' ? 'ativo' : 'desativado'}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2">
                      {new Date(link.linked_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        className={`!px-3 !py-1 !text-xs ${
                          link.status === 'active' ? '!text-error hover:!text-error' : ''
                        }`}
                        onClick={() => setConfirming(link)}
                      >
                        {link.status === 'active' ? 'Desativar' : 'Reativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming?.status === 'active' ? 'Desativar vínculo' : 'Reativar vínculo'}
      >
        {confirming && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-2">
              {confirming.status === 'active'
                ? 'O aluno perde o acesso aos treinos deste profissional até o vínculo ser reativado.'
                : 'O vínculo volta a valer. Falha se o aluno já tiver outro profissional ativo no mesmo papel.'}
            </p>
            <p className="font-mono text-xs text-text-3">
              {confirming.student.email} ↔ {confirming.professional.email}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="!px-4 !py-1.5 !text-xs"
                onClick={() => setConfirming(null)}
              >
                Cancelar
              </Button>
              <Button
                className={`!px-4 !py-1.5 !text-xs ${
                  confirming.status === 'active' ? '!bg-error !text-text-inv' : ''
                }`}
                onClick={handleToggle}
                disabled={patchLink.isPending}
              >
                {patchLink.isPending
                  ? 'Salvando…'
                  : confirming.status === 'active'
                    ? 'Desativar'
                    : 'Reativar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

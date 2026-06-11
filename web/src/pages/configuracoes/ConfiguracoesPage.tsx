import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { type AxiosError } from 'axios';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useMe } from '../../hooks/useMe';
import { ChangePasswordResponseSchema } from '../../lib/schemas';
import { useAuthStore } from '../../store/authStore';

const inputClass =
  'h-9 w-full rounded-xl border border-outline-v bg-surface-2 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none disabled:opacity-50';

const labelClass = 'mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-3';

const tipoLabels: Record<string, string> = {
  personal: 'Personal trainer',
  nutricionista: 'Nutricionista',
  actus_admin: 'Admin Actus',
  actus_suporte: 'Suporte Actus',
};

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const meQuery = useMe();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Configurações
        </h1>
      </div>

      <div className="flex max-w-xl flex-col gap-4 p-6">
        <Card>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
            Perfil profissional
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <span className={labelClass}>Nome de exibição</span>
              <p className="text-sm text-text-1">
                {meQuery.isLoading ? '…' : (meQuery.data?.display_name ?? '—')}
              </p>
            </div>
            <div>
              <span className={labelClass}>Tipo de conta</span>
              <p className="text-sm text-text-1">
                {meQuery.isLoading
                  ? '…'
                  : (tipoLabels[meQuery.data?.tipo ?? ''] ?? meQuery.data?.tipo ?? '—')}
              </p>
            </div>

            {/* [MOCK — sem endpoint na API v1] Campos profissionais ainda não editáveis pela API. */}
            <div className="mt-2 flex flex-col gap-3 border-t border-outline-v pt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
                Edição indisponível — sem endpoint na API v1
              </p>
              <div>
                <label htmlFor="cfg-area" className={labelClass}>
                  Área de atuação
                </label>
                <input id="cfg-area" className={inputClass} disabled placeholder="—" />
              </div>
              <div>
                <label htmlFor="cfg-cref" className={labelClass}>
                  Registro (CREF/CRN)
                </label>
                <input id="cfg-cref" className={inputClass} disabled placeholder="—" />
              </div>
              <div>
                <label htmlFor="cfg-cidade" className={labelClass}>
                  Cidade
                </label>
                <input id="cfg-cidade" className={inputClass} disabled placeholder="—" />
              </div>
            </div>
          </div>
        </Card>

        <ChangePasswordCard />

        <Card className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
              Sessão
            </h2>
            <p className="mt-1 text-xs text-text-3">Encerra a sessão neste navegador.</p>
          </div>
          <Button
            variant="secondary"
            className="!border-error !px-4 !py-1.5 !text-xs !text-error hover:!border-error hover:!text-error"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Sair
          </Button>
        </Card>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError('A nova senha precisa de pelo menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }
    setPending(true);
    try {
      const r = await api.post('/auth/change-password', {
        current_password: current,
        new_password: next,
      });
      const data = ChangePasswordResponseSchema.parse(r.data);
      // REGRA CRÍTICA: change-password NÃO retorna refresh novo —
      // troca só o access token e PRESERVA o refresh atual no store.
      const { refreshToken, setTokens } = useAuthStore.getState();
      if (refreshToken) setTokens(data.access_token, refreshToken);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast('Senha alterada.');
    } catch (err) {
      // Branch sempre no campo `error` do body — nunca pelo HTTP status.
      const branch = axios.isAxiosError(err)
        ? (err as AxiosError<{ error?: string }>).response?.data?.error
        : undefined;
      if (branch === 'invalid_credentials') setError('Senha atual incorreta.');
      else if (branch === 'invalid_body') setError('Verifique os campos e tente de novo.');
      else setError('Não foi possível alterar a senha. Tente de novo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
        Trocar senha
      </h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="pw-current" className={labelClass}>
            Senha atual
          </label>
          <input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="pw-next" className={labelClass}>
            Nova senha (mínimo 8 caracteres)
          </label>
          <input
            id="pw-next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
            required
            minLength={8}
          />
        </div>
        <div>
          <label htmlFor="pw-confirm" className={labelClass}>
            Confirmar nova senha
          </label>
          <input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" className="!px-4 !py-1.5 !text-xs" disabled={pending}>
            {pending ? 'Alterando…' : 'Alterar senha'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

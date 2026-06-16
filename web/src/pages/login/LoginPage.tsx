import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { Button } from '../../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate('/app', { replace: true });
      return;
    }
    if (result.error === 'invalid_credentials') {
      setError('Email ou senha incorretos.');
    } else if (result.error === 'must_change_password') {
      setWarning('Sua senha precisa ser trocada. Use o app para definir uma nova senha.');
    } else {
      setError('Não foi possível entrar. Tente novamente.');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-outline-v bg-surface-1 px-4 py-3 text-text-1 placeholder:text-text-3 outline-none focus:border-neon';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm rounded-xl border border-outline-v bg-surface-1 p-8">
        <h1 className="mb-8 text-center font-display text-4xl font-black uppercase tracking-wide text-neon">
          Actus
        </h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-text-3">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-text-3">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
          {warning && <p className="text-sm text-warning">{warning}</p>}
        </form>
      </div>
    </div>
  );
}

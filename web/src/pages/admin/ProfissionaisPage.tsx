import { useState, type FormEvent } from 'react';
import axios, { type AxiosError } from 'axios';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useCreateProfessional, type CreateProfessionalBody } from '../../hooks/useAdmin';

const inputClass =
  'h-9 w-full rounded-xl border border-outline-v bg-surface-2 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none';
const labelClass = 'mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-3';

type Role = 'personal' | 'nutricionista';

export function ProfissionaisPage() {
  const { toast } = useToast();
  const createProfessional = useCreateProfessional();

  const [role, setRole] = useState<Role>('personal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [registro, setRegistro] = useState(''); // CREF ou CRN, conforme o papel
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setEmail('');
    setPassword('');
    setFullName('');
    setBirthDate('');
    setRegistro('');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('A senha inicial precisa de pelo menos 8 caracteres.');
      return;
    }
    const reg = registro.trim();
    // Discriminated union do backend: CREF para personal, CRN para nutricionista.
    const body: CreateProfessionalBody =
      role === 'personal'
        ? {
            professional_role: 'personal',
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            birth_date: birthDate,
            must_change_password: true,
            ...(reg ? { cref_number: reg } : {}),
          }
        : {
            professional_role: 'nutricionista',
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            birth_date: birthDate,
            must_change_password: true,
            ...(reg ? { crn_number: reg } : {}),
          };

    createProfessional.mutate(body, {
      onSuccess: (created) => {
        toast(`Profissional ${created.email} criado. Vai trocar a senha no primeiro acesso.`);
        reset();
      },
      onError: (err) => {
        const branch = axios.isAxiosError(err)
          ? (err as AxiosError<{ error?: string }>).response?.data?.error
          : undefined;
        if (branch === 'email_already_in_use') setError('Este e-mail já está em uso.');
        else if (branch === 'invalid_body') setError('Verifique os campos e tente de novo.');
        else setError('Não foi possível criar o profissional. Tente de novo.');
      },
    });
  }

  return (
    <>
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Profissionais
        </h1>
      </div>
      <div className="max-w-xl p-6">
        <Card>
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
            Criar profissional
          </h2>
          <p className="mt-1 text-xs text-text-3">
            A conta nasce com troca de senha obrigatória no primeiro acesso.
          </p>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
            <fieldset>
              <legend className={labelClass}>Papel</legend>
              <div className="flex gap-1">
                {(['personal', 'nutricionista'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setRegistro('');
                    }}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                      role === r ? 'bg-neon/10 text-neon' : 'text-text-3 hover:text-text-1'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="prof-name" className={labelClass}>
                Nome completo
              </label>
              <input
                id="prof-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                required
                minLength={3}
              />
            </div>
            <div>
              <label htmlFor="prof-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="prof-password" className={labelClass}>
                Senha inicial (mínimo 8 caracteres)
              </label>
              <input
                id="prof-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="prof-birth" className={labelClass}>
                Data de nascimento
              </label>
              <input
                id="prof-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="prof-registro" className={labelClass}>
                {role === 'personal' ? 'CREF (opcional)' : 'CRN (opcional)'}
              </label>
              <input
                id="prof-registro"
                value={registro}
                onChange={(e) => setRegistro(e.target.value)}
                className={inputClass}
                placeholder="—"
              />
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="!px-4 !py-1.5 !text-xs"
                disabled={createProfessional.isPending}
              >
                {createProfessional.isPending ? 'Criando…' : 'Criar profissional'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

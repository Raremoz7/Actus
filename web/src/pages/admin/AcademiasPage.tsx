import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useToast } from '../../components/ui/Toast';
import { useAcademies, useCreateAcademy, useCreateAcademyManager } from '../../hooks/useAcademyAdmin';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';
const inputClass =
  'w-full rounded-xl border border-outline-v bg-surface-1 px-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none focus:border-neon';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-text-3';

export function AcademiasPage() {
  const { data: academies = [], isLoading } = useAcademies();
  const createAcademy = useCreateAcademy();
  const createManager = useCreateAcademyManager();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cnpj, setCnpj] = useState('');

  const [managerFor, setManagerFor] = useState<{ id: string; name: string } | null>(null);
  const [gEmail, setGEmail] = useState('');
  const [gPassword, setGPassword] = useState('');
  const [gName, setGName] = useState('');

  async function onCreateAcademy(e: FormEvent) {
    e.preventDefault();
    try {
      await createAcademy.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
      });
      toast('Academia criada.');
      setName('');
      setSlug('');
      setCnpj('');
      setCreateOpen(false);
    } catch (err) {
      const code = axios.isAxiosError(err) ? (err.response?.data?.error as string | undefined) : undefined;
      toast(code === 'slug_already_in_use' ? 'Esse slug já está em uso.' : 'Não foi possível criar a academia.', 'error');
    }
  }

  async function onCreateManager(e: FormEvent) {
    e.preventDefault();
    if (!managerFor) return;
    try {
      await createManager.mutateAsync({
        academyId: managerFor.id,
        // must_change_password=false: o gestor usa a web, que ainda não tem fluxo de troca de senha.
        body: { email: gEmail.trim(), password: gPassword, full_name: gName.trim(), must_change_password: false },
      });
      toast('Gestor designado.');
      setGEmail('');
      setGPassword('');
      setGName('');
      setManagerFor(null);
    } catch (err) {
      const code = axios.isAxiosError(err) ? (err.response?.data?.error as string | undefined) : undefined;
      toast(code === 'email_already_in_use' ? 'Esse email já está em uso.' : 'Não foi possível designar o gestor.', 'error');
    }
  }

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center justify-between border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">Academias</h1>
        <Button onClick={() => setCreateOpen(true)}>Nova academia</Button>
      </div>

      <div className="p-6">
        <Card>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : academies.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Nenhuma academia cadastrada.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <th className={thClass}>Academia</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Gestores</th>
                  <th className={thClass}>Instrutores</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {academies.map((a) => (
                  <tr key={a.id} className="border-b border-outline-v/40">
                    <td className="py-2 text-sm text-text-1">{a.name}</td>
                    <td className="py-2">
                      <Tag variant={a.status === 'active' ? 'active' : 'default'}>
                        {a.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Tag>
                    </td>
                    <td className="py-2 font-mono text-sm text-text-2">{a.managers}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{a.instructors}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setManagerFor({ id: a.id, name: a.name })}
                        className="text-xs text-text-3 hover:text-neon"
                      >
                        {a.managers === 0 ? 'Designar gestor' : 'Adicionar gestor'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova academia">
        <form onSubmit={onCreateAcademy} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Nome</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Slug (opcional)</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-academia" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>CNPJ (opcional)</span>
            <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputClass} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAcademy.isPending}>
              {createAcademy.isPending ? 'Criando…' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={managerFor != null} onClose={() => setManagerFor(null)} title={`Gestor — ${managerFor?.name ?? ''}`}>
        <form onSubmit={onCreateManager} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Nome completo</span>
            <input required value={gName} onChange={(e) => setGName(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Email</span>
            <input type="email" required value={gEmail} onChange={(e) => setGEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Senha inicial</span>
            <input type="text" required minLength={8} value={gPassword} onChange={(e) => setGPassword(e.target.value)} placeholder="mín. 8 caracteres" className={inputClass} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setManagerFor(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createManager.isPending}>
              {createManager.isPending ? 'Salvando…' : 'Designar gestor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

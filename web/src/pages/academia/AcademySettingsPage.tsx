import { Card } from '../../components/ui/Card';
import { selectAcademy, useAuthStore } from '../../store/authStore';

export function AcademySettingsPage() {
  const academy = useAuthStore(selectAcademy);
  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">Configurações</h1>
      </div>
      <div className="p-6">
        <Card className="flex max-w-lg flex-col gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-3">Academia</p>
            <p className="text-sm text-text-1">{academy?.name ?? '—'}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-3">Seu papel</p>
            <p className="text-sm text-text-1">Gestor</p>
          </div>
          <p className="border-t border-outline-v pt-4 text-xs text-text-3">
            Dados cadastrais e demais configurações da academia são administrados pela equipe Actus nesta fase.
          </p>
        </Card>
      </div>
    </div>
  );
}

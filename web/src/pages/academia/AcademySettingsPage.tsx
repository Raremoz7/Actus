import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { PageHeader } from '../../components/ui/PageHeader';
import { selectAcademy, useAuthStore } from '../../store/authStore';

export function AcademySettingsPage() {
  const academy = useAuthStore(selectAcademy);
  return (
    <div className="flex-1">
      <PageHeader title="Configurações" />
      <div className="p-6">
        <Card className="flex max-w-lg flex-col gap-4">
          <div>
            <Eyebrow as="p">Academia</Eyebrow>
            <p className="text-sm text-text-1">{academy?.name ?? '—'}</p>
          </div>
          <div>
            <Eyebrow as="p">Seu papel</Eyebrow>
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

// [MOCK — sem endpoint na API v1]
// As preferências do onboarding do aluno ainda não são expostas pela API
// (pendência item 5 em docs/backend-pendencias.md do app). Dados estáticos de exemplo.
import { Card } from '../../components/ui/Card';
import { Tag } from '../../components/ui/Tag';

const MOCK_PREFERENCES = [
  { label: 'Interesse principal', value: 'Hipertrofia' },
  { label: 'Experiência', value: 'Intermediário' },
  { label: 'Dias por semana', value: '4' },
  { label: 'Local de treino', value: 'Academia' },
  { label: 'Altura', value: '1,75 m' },
];

export function PreferenciasTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
          Preferências
        </h2>
        <Tag variant="warn">Dados de exemplo</Tag>
      </div>
      <Card className="border-warning/40">
        <p className="text-sm text-text-2">
          Disponível quando o backend expor as preferências do onboarding. Os valores abaixo são
          ilustrativos.
        </p>
      </Card>
      <Card className="!p-0">
        <ul>
          {MOCK_PREFERENCES.map((p) => (
            <li
              key={p.label}
              className="flex items-center justify-between border-b border-outline-v px-4 py-3 last:border-b-0"
            >
              <span className="text-sm text-text-2">{p.label}</span>
              <span className="font-mono text-sm text-text-1">{p.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import { SegmentedControl } from '@/components/ui';

export type WorkoutScope = 'meus' | 'banco';

type Props = {
  value: WorkoutScope;
  onChange: (v: WorkoutScope) => void;
};

const OPTIONS: { value: WorkoutScope; label: string }[] = [
  { value: 'meus', label: 'Meus' },
  { value: 'banco', label: 'Banco' },
];

// Segmented control "Meus | Banco" no topo da aba Treinos.
export function WorkoutScopeToggle({ value, onChange }: Props) {
  return <SegmentedControl options={OPTIONS} value={value} onChange={onChange} />;
}

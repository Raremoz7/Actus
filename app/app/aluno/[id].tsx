import { useLocalSearchParams } from 'expo-router';

import { StudentDetailScreen } from '@/components/professional';

// Detalhe do aluno — rota empilhada na raiz (fora dos grupos), reutilizada por
// personal e nutricionista. A lógica fica em StudentDetailScreen.
export default function AlunoDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <StudentDetailScreen id={id} />;
}

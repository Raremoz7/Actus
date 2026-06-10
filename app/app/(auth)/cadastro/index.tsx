import { Redirect } from 'expo-router';

// Entrada do cadastro → sempre começa no passo 1 (convite).
export default function CadastroIndex() {
  return <Redirect href="/(auth)/cadastro/passo-1-convite" />;
}

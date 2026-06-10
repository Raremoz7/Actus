import { Stack } from 'expo-router';

// Sub-stack do cadastro multi-passo: headerless, slide horizontal entre os passos.
export default function CadastroLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    />
  );
}

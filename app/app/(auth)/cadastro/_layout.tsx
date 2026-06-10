import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { View } from 'react-native';

// Grupo do cadastro do aluno — hoje uma tela única (conta enxuta do onboarding).
// O Stack permanece para futuras telas do grupo.
export default function CadastroLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: styles.content,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  content: { backgroundColor: theme.colors.bgBase },
}));

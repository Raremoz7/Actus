import { View } from 'react-native';
import { router } from '@/navigation';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen padded>
      <View style={styles.container}>
        <AppText variant="h2" style={styles.title}>
          Tela não encontrada
        </AppText>
        <AppText variant="bodySm" color="tertiary" style={styles.message}>
          Este endereço não existe mais.
        </AppText>
        <View style={styles.action}>
          <Button variant="primary" label="Voltar ao início" onPress={() => router.replace('/')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.lg,
  },
}));

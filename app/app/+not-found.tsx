import { View } from 'react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen padded>
      <View style={styles.container}>
        <AppText variant="h2">Tela não encontrada</AppText>
        <View style={styles.action}>
          <Button variant="ghost" label="Voltar ao início" onPress={() => router.replace('/')} />
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
    gap: theme.spacing.lg,
  },
  action: {
    alignSelf: 'stretch',
  },
}));

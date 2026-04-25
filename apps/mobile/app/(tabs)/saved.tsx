import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>Your saved listings will appear here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});

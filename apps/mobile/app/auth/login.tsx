import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Rentage</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#2563eb', textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: '#111827', textAlign: 'center', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  form: { marginTop: 32, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6b7280', fontSize: 14 },
  linkText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});

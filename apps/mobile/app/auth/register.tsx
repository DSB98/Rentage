import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useState } from 'react';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'RENTER' | 'OWNER'>('RENTER');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Rentage</Text>
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'RENTER' && styles.roleActive]}
            onPress={() => setRole('RENTER')}
          >
            <Text style={[styles.roleText, role === 'RENTER' && styles.roleTextActive]}>
              🔍 Rent Things
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'OWNER' && styles.roleActive]}
            onPress={() => setRole('OWNER')}
          >
            <Text style={[styles.roleText, role === 'OWNER' && styles.roleTextActive]}>
              📋 List Assets
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign in</Text>
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
  roleSelector: { flexDirection: 'row', gap: 12, marginTop: 24 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  roleActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  roleTextActive: { color: '#1d4ed8' },
  form: { marginTop: 20, gap: 12 },
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

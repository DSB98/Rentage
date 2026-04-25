import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const categories = [
  { name: 'Homes', slug: 'homes', icon: '🏠' },
  { name: 'Flats', slug: 'flats', icon: '🏢' },
  { name: 'PGs', slug: 'pgs', icon: '🛏️' },
  { name: 'Cars', slug: 'cars', icon: '🚗' },
  { name: 'Bikes', slug: 'bikes', icon: '🏍️' },
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Furniture', slug: 'furniture', icon: '🪑' },
  { name: 'Others', slug: 'others', icon: '📦' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Rentage</Text>
          <Text style={styles.tagline}>Rent anything, anywhere</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Link href="/search" asChild>
            <TouchableOpacity style={styles.searchBar}>
              <Text style={styles.searchPlaceholder}>What are you looking to rent?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.slug} style={styles.categoryCard}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingBottom: 10 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
  tagline: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  searchBar: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchPlaceholder: { color: '#9ca3af', fontSize: 15 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '22%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 11, color: '#374151', marginTop: 4, textAlign: 'center' },
});

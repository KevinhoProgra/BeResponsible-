import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ExpenseType = 'Fijo' | 'Repentino';
type Section = 'Resumen' | 'Gastos' | 'Ahorro' | 'Config.';
type ThemeName = 'Verde' | 'Azul' | 'Coral';

type Expense = {
  id: number;
  name: string;
  amount: number;
  type: ExpenseType;
};

type Theme = {
  primary: string;
  primaryLight: string;
  accent: string;
  background: string;
};

const themes: Record<ThemeName, Theme> = {
  Verde: { primary: '#1D6B58', primaryLight: '#E2F1EB', accent: '#64B79A', background: '#F5F8F5' },
  Azul: { primary: '#28618C', primaryLight: '#E4F0F8', accent: '#6FAFD1', background: '#F4F8FB' },
  Coral: { primary: '#B85D4C', primaryLight: '#FBEAE5', accent: '#E99B84', background: '#FCF7F5' },
};

const initialExpenses: Expense[] = [
  { id: 1, name: 'Renta', amount: 5200, type: 'Fijo' },
  { id: 2, name: 'Supermercado', amount: 1800, type: 'Fijo' },
  { id: 3, name: 'Transporte', amount: 1200, type: 'Fijo' },
  { id: 4, name: 'Salidas', amount: 1000, type: 'Repentino' },
];

const money = (value: number) =>
  `$${Math.max(0, value).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const parseAmount = (value: string) => {
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export default function HomeScreen() {
  const [section, setSection] = useState<Section>('Resumen');
  const [themeName, setThemeName] = useState<ThemeName>('Verde');
  const [salary, setSalary] = useState('18000');
  const [savingsGoal, setSavingsGoal] = useState('4000');
  const [freeSpending, setFreeSpending] = useState('3000');
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseType, setNewExpenseType] = useState<ExpenseType>('Fijo');
  const theme = themes[themeName];

  const summary = useMemo(() => {
    const fixed = expenses.filter((expense) => expense.type === 'Fijo').reduce((total, expense) => total + expense.amount, 0);
    const sudden = expenses.filter((expense) => expense.type === 'Repentino').reduce((total, expense) => total + expense.amount, 0);
    const income = parseAmount(salary);
    const goal = parseAmount(savingsGoal);
    const spending = parseAmount(freeSpending);
    const committed = fixed + sudden + spending;
    const availableForSaving = income - committed;
    const overspending = committed > income - goal;
    return {
      fixed,
      sudden,
      income,
      goal,
      spending,
      plannedSaving: Math.max(0, availableForSaving),
      available: Math.max(0, income - fixed - sudden - goal),
      overspending,
      overBy: Math.max(0, committed - (income - goal)),
    };
  }, [expenses, freeSpending, salary, savingsGoal]);

  const addExpense = () => {
    const name = newExpenseName.trim();
    const amount = parseAmount(newExpenseAmount);
    if (!name || amount <= 0) return;
    setExpenses((current) => [...current, { id: Date.now(), name, amount, type: newExpenseType }]);
    setNewExpenseName('');
    setNewExpenseAmount('');
    setNewExpenseType('Fijo');
    setModalVisible(false);
  };

  const projection = [1, 3, 6, 9, 12].map((month) => ({ month, amount: summary.plannedSaving * month }));
  const maxProjection = Math.max(projection[projection.length - 1].amount, 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MI PLAN FINANCIERO</Text>
            <Text style={styles.title}>Hola, ¡qué bueno verte!</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>BR</Text>
          </View>
        </View>

        {summary.overspending && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>!</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Vas gastando más de lo recomendado</Text>
              <Text style={styles.warningText}>
                Reduce {money(summary.overBy)} para mantener tu meta de ahorro de {money(summary.goal)}.
              </Text>
            </View>
          </View>
        )}

        {section === 'Resumen' && (
          <>
            <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>Disponible este mes</Text>
                  <Text style={styles.heroAmount}>{money(summary.available)}</Text>
                </View>
                <View style={styles.checkCircle}><Text style={styles.check}>✓</Text></View>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStats}>
                <Stat label="Ingresos" value={money(summary.income)} />
                <Stat label="Meta de ahorro" value={money(summary.goal)} />
                <Stat label="Ahorro estimado" value={money(summary.plannedSaving)} />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Vista general</Text>
            <View style={styles.overviewGrid}>
              <OverviewCard label="Gastos fijos" value={money(summary.fixed)} icon="⌂" color={theme.primary} />
              <OverviewCard label="Gastos repentinos" value={money(summary.sudden)} icon="⚡" color="#C97932" />
              <OverviewCard label="Gasto libre" value={money(summary.spending)} icon="◈" color="#788B82" />
              <OverviewCard label="Meta anual" value={money(summary.goal * 12)} icon="↗" color={theme.accent} />
            </View>
            <View style={styles.tipCard}>
              <Text style={[styles.tipTitle, { color: theme.primary }]}>Consejo para ti</Text>
              <Text style={styles.tipText}>Tu ahorro estimado es {money(summary.plannedSaving)} al mes. Mantén tus gastos dentro del presupuesto para lograr tu meta.</Text>
            </View>
          </>
        )}

        {section === 'Config.' && (
          <>
            <SectionHeading title="Tu configuración" subtitle="Ajusta tu plan cuando quieras" />
            <View style={styles.settingsCard}>
              <SettingRow label="Salario mensual" value={salary} onChangeText={setSalary} />
              <SettingRow label="Quiero ahorrar" value={savingsGoal} onChangeText={setSavingsGoal} />
              <SettingRow label="Gasto libre mensual" value={freeSpending} onChangeText={setFreeSpending} last />
            </View>
            <Text style={styles.sectionTitle}>Personaliza tus colores</Text>
            <Text style={styles.mutedText}>Elige el estilo que prefieras para tu plan.</Text>
            <View style={styles.themeOptions}>
              {(Object.keys(themes) as ThemeName[]).map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setThemeName(name)}
                  style={[styles.themeOption, { borderColor: themeName === name ? themes[name].primary : '#DCE7E0' }]}
                >
                  <View style={[styles.themeDot, { backgroundColor: themes[name].primary }]} />
                  <Text style={[styles.themeName, themeName === name && { color: themes[name].primary }]}>{name}</Text>
                  {themeName === name && <Text style={[styles.themeCheck, { color: themes[name].primary }]}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {section === 'Gastos' && (
          <>
            <View style={styles.sectionHeader}>
              <SectionHeading title="Mis gastos" subtitle="Registra todo para tener claridad" />
              <Pressable style={[styles.addButton, { backgroundColor: theme.primaryLight }]} onPress={() => setModalVisible(true)}>
                <Text style={[styles.addButtonText, { color: theme.primary }]}>+ Añadir</Text>
              </Pressable>
            </View>
            <View style={styles.expenseSummary}>
              <ExpenseTotal icon="⌂" label="Gastos fijos" amount={summary.fixed} color={theme.primary} />
              <View style={styles.summaryDivider} />
              <ExpenseTotal icon="⚡" label="Repentinos" amount={summary.sudden} color="#C97932" />
            </View>
            <ExpenseList expenses={expenses} setExpenses={setExpenses} />
          </>
        )}

        {section === 'Ahorro' && (
          <>
            <SectionHeading title="Ahorro a la larga" subtitle="Si mantienes este ritmo" />
            <View style={[styles.savingHighlight, { backgroundColor: theme.primary }]}>
              <Text style={styles.heroLabel}>Podrías ahorrar en 12 meses</Text>
              <Text style={styles.savingTotal}>{money(summary.plannedSaving * 12)}</Text>
              <Text style={styles.savingSmall}>{money(summary.plannedSaving)} cada mes</Text>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.chart}>
                {projection.map((item) => (
                  <View style={styles.barGroup} key={item.month}>
                    <Text style={styles.barAmount}>{money(item.amount)}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { backgroundColor: theme.accent, height: `${Math.max(8, (item.amount / maxProjection) * 100)}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.month} {item.month === 1 ? 'mes' : 'meses'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.navBar}>
        <NavItem icon="⌂" label="Resumen" active={section === 'Resumen'} color={theme.primary} onPress={() => setSection('Resumen')} />
        <NavItem icon="▣" label="Gastos" active={section === 'Gastos'} color={theme.primary} onPress={() => setSection('Gastos')} />
        <NavItem icon="↗" label="Ahorro" active={section === 'Ahorro'} color={theme.primary} onPress={() => setSection('Ahorro')} />
        <NavItem icon="⚙" label="Config." active={section === 'Config.'} color={theme.primary} onPress={() => setSection('Config.')} />
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Añadir gasto</Text><Pressable onPress={() => setModalVisible(false)}><Text style={styles.closeButton}>×</Text></Pressable></View>
            <Text style={styles.inputLabel}>Nombre del gasto</Text>
            <TextInput value={newExpenseName} onChangeText={setNewExpenseName} placeholder="Ej. Internet" placeholderTextColor="#98A69F" style={styles.input} />
            <Text style={styles.inputLabel}>Cantidad</Text>
            <View style={styles.amountInput}><Text style={styles.inputPrefix}>$</Text><TextInput value={newExpenseAmount} onChangeText={setNewExpenseAmount} placeholder="0" placeholderTextColor="#98A69F" keyboardType="decimal-pad" style={styles.amountTextInput} /></View>
            <Text style={styles.inputLabel}>Tipo de gasto</Text>
            <View style={styles.typeSelector}>
              {(['Fijo', 'Repentino'] as ExpenseType[]).map((type) => (
                <Pressable key={type} onPress={() => setNewExpenseType(type)} style={[styles.typeOption, newExpenseType === type && { backgroundColor: theme.primaryLight, borderColor: theme.accent }]}>
                  <Text style={[styles.typeOptionText, newExpenseType === type && { color: theme.primary }]}>{type}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={addExpense}><Text style={styles.saveButtonText}>Guardar gasto</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.heading}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.mutedText}>{subtitle}</Text></View>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View><Text style={styles.heroStatLabel}>{label}</Text><Text style={styles.heroStatValue}>{value}</Text></View>;
}

function OverviewCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return <View style={styles.overviewCard}><Text style={[styles.overviewIcon, { color }]}>{icon}</Text><Text style={styles.overviewLabel}>{label}</Text><Text style={styles.overviewValue}>{value}</Text></View>;
}

function SettingRow({ label, value, onChangeText, last }: { label: string; value: string; onChangeText: (value: string) => void; last?: boolean }) {
  return <View style={[styles.settingRow, last && styles.settingRowLast]}><Text style={styles.settingLabel}>{label}</Text><View style={styles.settingInput}><Text style={styles.settingPrefix}>$</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.settingValue} /></View></View>;
}

function ExpenseTotal({ icon, label, amount, color }: { icon: string; label: string; amount: number; color: string }) {
  return <View style={styles.totalItem}><Text style={[styles.totalIcon, { color }]}>{icon}</Text><View><Text style={styles.totalLabel}>{label}</Text><Text style={styles.totalAmount}>{money(amount)}</Text></View></View>;
}

function ExpenseList({ expenses, setExpenses }: { expenses: Expense[]; setExpenses: (update: (current: Expense[]) => Expense[]) => void }) {
  return <View style={styles.expenseList}>{expenses.map((expense) => <View style={styles.expenseRow} key={expense.id}><View style={[styles.expenseIcon, expense.type === 'Repentino' ? styles.suddenIcon : styles.fixedIcon]}><Text>{expense.type === 'Repentino' ? '⚡' : '⌂'}</Text></View><View style={styles.expenseInfo}><Text style={styles.expenseName}>{expense.name}</Text><Text style={styles.expenseType}>{expense.type}</Text></View><Text style={styles.expenseAmount}>{money(expense.amount)}</Text><Pressable hitSlop={10} onPress={() => setExpenses((current) => current.filter((item) => item.id !== expense.id))}><Text style={styles.removeExpense}>×</Text></Pressable></View>)}</View>;
}

function NavItem({ icon, label, active, color, onPress }: { icon: string; label: Section; active: boolean; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.navItem}><Text style={[styles.navIcon, active && { color }]}>{icon}</Text><Text style={[styles.navLabel, active && { color, fontWeight: '800' }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 18 },
  eyebrow: { color: '#6A8177', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 7 },
  title: { color: '#183A30', fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  avatar: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '800', fontSize: 14 },
  warningCard: { backgroundColor: '#FFF1E5', borderColor: '#F3C69E', borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  warningIcon: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#D77D3D', color: '#FFF', textAlign: 'center', lineHeight: 27, fontWeight: '900', marginRight: 10 },
  warningContent: { flex: 1 },
  warningTitle: { color: '#9A4C21', fontSize: 13, fontWeight: '800' },
  warningText: { color: '#A66C4A', fontSize: 11, marginTop: 3 },
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#1D6B58', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#B6DACE', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  heroAmount: { color: '#FFF', fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  checkCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#39836E', justifyContent: 'center', alignItems: 'center' },
  check: { color: '#D8F2E7', fontSize: 24, fontWeight: '700' },
  heroDivider: { height: 1, backgroundColor: '#418470', marginVertical: 18 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStatLabel: { color: '#B6DACE', fontSize: 11, marginBottom: 5 },
  heroStatValue: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  heading: { marginBottom: 14 },
  sectionTitle: { color: '#183A30', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  mutedText: { color: '#8A9992', fontSize: 12, marginTop: 4 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  overviewCard: { width: '48.2%', backgroundColor: '#FFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E6EDE8' },
  overviewIcon: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  overviewLabel: { color: '#74847D', fontSize: 11 },
  overviewValue: { color: '#29463D', fontSize: 16, fontWeight: '800', marginTop: 4 },
  tipCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E6EDE8' },
  tipTitle: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
  tipText: { color: '#718179', fontSize: 12, lineHeight: 18 },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E6EDE8', marginBottom: 26 },
  settingRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EDF1EE' },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: { color: '#63776E', fontSize: 14, fontWeight: '600' },
  settingInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8F5', borderRadius: 10, paddingHorizontal: 10, minWidth: 105 },
  settingPrefix: { color: '#1D6B58', fontSize: 14, fontWeight: '800' },
  settingValue: { color: '#183A30', fontSize: 16, fontWeight: '800', paddingVertical: 9, paddingLeft: 3, textAlign: 'right', flex: 1 },
  themeOptions: { gap: 10, marginTop: 12 },
  themeOption: { backgroundColor: '#FFF', borderWidth: 2, borderRadius: 13, padding: 13, flexDirection: 'row', alignItems: 'center' },
  themeDot: { width: 20, height: 20, borderRadius: 10, marginRight: 10 },
  themeName: { color: '#536960', fontWeight: '700', flex: 1 },
  themeCheck: { fontSize: 18, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  addButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 2 },
  addButtonText: { fontSize: 12, fontWeight: '800' },
  expenseSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E6EDE8' },
  totalItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  totalIcon: { fontSize: 22, fontWeight: '800' },
  totalLabel: { color: '#74847D', fontSize: 11, marginBottom: 3 },
  totalAmount: { color: '#183A30', fontSize: 17, fontWeight: '800' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#E4EBE6', marginHorizontal: 12 },
  expenseList: { backgroundColor: '#FFF', borderRadius: 18, marginTop: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E6EDE8' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F3F1' },
  expenseIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  fixedIcon: { backgroundColor: '#E2F1EB' },
  suddenIcon: { backgroundColor: '#FFF0DF' },
  expenseInfo: { flex: 1 },
  expenseName: { color: '#29463D', fontSize: 14, fontWeight: '700' },
  expenseType: { color: '#8A9992', fontSize: 11, marginTop: 3 },
  expenseAmount: { color: '#29463D', fontSize: 14, fontWeight: '800', marginRight: 12 },
  removeExpense: { color: '#A7B4AD', fontSize: 22, fontWeight: '300' },
  savingHighlight: { borderRadius: 20, padding: 20, marginBottom: 14 },
  savingTotal: { color: '#FFF', fontSize: 35, fontWeight: '800', marginVertical: 3 },
  savingSmall: { color: '#D8F2E7', fontSize: 12 },
  chartCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E6EDE8' },
  chart: { height: 158, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barGroup: { height: '100%', alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  barAmount: { color: '#789087', fontSize: 9, marginBottom: 5 },
  barTrack: { height: 93, width: 28, justifyContent: 'flex-end', backgroundColor: '#EEF5F0', borderRadius: 8, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { color: '#829189', fontSize: 10, marginTop: 7 },
  navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5ECE7', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 65 },
  navIcon: { color: '#A1AEA7', fontSize: 20, marginBottom: 3 },
  navLabel: { color: '#899790', fontSize: 10 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 42, 33, 0.35)' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: Platform.OS === 'ios' ? 34 : 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#183A30', fontSize: 21, fontWeight: '800' },
  closeButton: { color: '#789087', fontSize: 29, fontWeight: '300' },
  inputLabel: { color: '#536960', fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 10 },
  input: { color: '#183A30', backgroundColor: '#F5F8F5', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15 },
  amountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8F5', borderRadius: 11, paddingLeft: 13 },
  inputPrefix: { color: '#1D6B58', fontSize: 16, fontWeight: '800' },
  amountTextInput: { color: '#183A30', paddingHorizontal: 8, paddingVertical: 12, fontSize: 15, flex: 1 },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeOption: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#DCE7E0', alignItems: 'center', paddingVertical: 11 },
  typeOptionText: { color: '#6D8178', fontWeight: '700' },
  saveButton: { borderRadius: 12, alignItems: 'center', paddingVertical: 14, marginTop: 24 },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

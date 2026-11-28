import { Platform, Pressable, Text, TextInput, View, StyleSheet } from "react-native";

// Apixora look, matching the website: green and gold on warm cream, serif headings.
export const colors = {
  green: "#1f4d3a", deep: "#163828", gold: "#b8923a", goldText: "#7a5c14",
  ink: "#1b1b1b", muted: "#5b5b55", line: "#e3ddcf", field: "#d8d0bd",
  cream: "#f7f4ec", card: "#ffffff", mint: "#e8efe9", sand: "#f3e7c6", sandText: "#6b4f0f",
};
export const serif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export function Button({ title, onPress, disabled, secondary }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, secondary && styles.btnAlt, disabled && { opacity: 0.5 }]}
    >
      <Text style={[styles.btnText, secondary && { color: colors.green }]}>{title}</Text>
    </Pressable>
  );
}

export function Field(props) {
  return <TextInput placeholderTextColor="#777" {...props} style={[styles.input, props.style]} />;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, paddingTop: 64, backgroundColor: colors.cream },
  h1: { fontSize: 32, lineHeight: 36, fontWeight: "700", color: colors.deep, marginBottom: 8, fontFamily: serif },
  h2: { fontSize: 22, fontWeight: "700", color: colors.deep, marginTop: 18, marginBottom: 8, fontFamily: serif },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: colors.goldText, marginBottom: 6 },
  p: { fontSize: 16, color: colors.ink, marginBottom: 12, lineHeight: 22 },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "700", marginTop: 10, marginBottom: 6, color: colors.ink },
  input: { borderWidth: 1.5, borderColor: colors.field, borderRadius: 12, padding: 14, fontSize: 17, backgroundColor: "#fff" },
  btn: { backgroundColor: colors.green, minHeight: 52, paddingHorizontal: 16, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
  btnAlt: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: colors.field },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 12 },
  chip: { borderWidth: 1.5, borderColor: colors.field, backgroundColor: "#fff", borderRadius: 22, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  error: { color: "#9b1c1c", marginTop: 8 },
});

export function Pill({ text, tone }) {
  const bg = tone === "gold" ? colors.sand : colors.mint;
  const fg = tone === "gold" ? colors.sandText : colors.green;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9 }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

// One shift, pay first: the rate in large type, the old rate crossed out when a bonus is added, then the total.
// `s` has role, when, base, rate, bonus, total, and optionally a pill and a footer line.
export function ShiftCard({ s, onPress, children }) {
  const bonus = Number(s.bonus) > 0;
  const body = (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.ink, flexShrink: 1 }}>{s.role}</Text>
        {bonus ? <Pill text="Bonus added" tone="gold" /> : s.pill ? <Pill text={s.pill} /> : null}
      </View>
      <Text style={[styles.muted, { marginTop: 2 }]}>{s.when}</Text>
      {s.unit ? <Text style={{ fontSize: 14, fontWeight: "700", color: colors.deep, marginTop: 2 }}>{s.unit}</Text> : null}
      {s.ratio ? <Text style={styles.muted}>{s.ratio}</Text> : null}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        {bonus ? <Text style={{ fontSize: 15, color: "#6b6b64", textDecorationLine: "line-through" }}>${s.base}</Text> : null}
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.green }}>
          ${s.rate}<Text style={{ fontSize: 15 }}>/hr</Text>
        </Text>
      </View>
      {bonus ? <Text style={styles.muted}>Includes a ${s.bonus}/hr facility bonus</Text> : null}
      <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 2 }}>${s.total} total for the shift</Text>
      {s.footer ? <Text style={[styles.muted, { marginTop: 4 }]}>{s.footer}</Text> : null}
      {children}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{body}</Pressable> : body;
}

// Bottom tab bar shared by signed-out visitors, applicants and cleared workers.
export function TabBar({ items, tab, onChange }) {
  return (
    <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: "#fff", paddingBottom: 18, paddingTop: 4 }}>
      {items.map(([key, label]) => (
        <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}
          onPress={() => onChange(key)} style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52 }}>
          <Text style={{ fontSize: 13, fontWeight: tab === key ? "700" : "600", color: tab === key ? colors.green : colors.muted }}>{label}</Text>
          <View style={{ height: 3, width: 24, borderRadius: 2, marginTop: 4, backgroundColor: tab === key ? colors.gold : "transparent" }} />
        </Pressable>
      ))}
    </View>
  );
}

// Pick one (value is a string) or several (value is an array) from a list.
export function Choice({ options, value, onChange, multi }) {
  const on = (o) => (multi ? value.includes(o) : value === o);
  const toggle = (o) =>
    onChange(multi ? (value.includes(o) ? value.filter((x) => x !== o) : [...value, o]) : o);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <Pressable key={o} accessibilityRole={multi ? "checkbox" : "radio"} accessibilityState={{ selected: on(o) }}
          onPress={() => toggle(o)}
          style={[styles.chip, on(o) && styles.chipOn]}>
          <Text style={{ color: on(o) ? "#fff" : colors.green, fontWeight: "600", fontSize: 15 }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function when(iso) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// Messages written by our own database rules (code P0001) are safe to show; others get the fallback.
export function friendly(error, fallback) {
  return error && error.code === "P0001" ? error.message : fallback;
}

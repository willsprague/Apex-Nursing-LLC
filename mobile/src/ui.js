import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";

export const colors = { green: "#1f4d3a", gold: "#b8923a", ink: "#1b1b1b", line: "#d9d9d9" };

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
  screen: { flex: 1, padding: 20, paddingTop: 64, backgroundColor: "#fff" },
  h1: { fontSize: 26, fontWeight: "700", color: colors.green, marginBottom: 8 },
  p: { fontSize: 16, color: colors.ink, marginBottom: 12, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 10, marginBottom: 4, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: colors.green, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  btnAlt: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.green },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: colors.green, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.green },
  error: { color: "#9b1c1c", marginTop: 8 },
});

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
          <Text style={{ color: on(o) ? "#fff" : colors.green }}>{o}</Text>
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

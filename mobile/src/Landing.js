import { View, Text, ScrollView } from "react-native";
import { Button, colors, styles } from "./ui";

// Public front page. Anyone can read it before signing in, so they can see what Apixora is.
// The shifts below are examples that show the layout, not live shifts.
const EXAMPLES = [
  { role: "Licensed Nursing Assistant", when: "Sat, 7:00 AM to 3:00 PM", pay: "$24.00/hr", total: "About $192 for 8 hours" },
  { role: "Licensed Practical Nurse", when: "Sun, 3:00 PM to 11:00 PM", was: "$38.00", pay: "$43.00/hr", note: "includes a $5 bonus", total: "About $344 for 8 hours" },
  { role: "Registered Nurse", when: "Mon, 11:00 PM to 7:00 AM", pay: "$52.00/hr", total: "About $416 for 8 hours" },
];

export default function Landing({ onSignIn, onApply }) {
  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.h1}>Apixora</Text>
      <Text style={[styles.p, { fontSize: 18 }]}>
        Nursing and care staff for New Hampshire long-term care, with the pay shown up front.
      </Text>
      <Button title="Apply today" onPress={onApply} />
      <Button title="Sign in" secondary onPress={onSignIn} />

      <Text style={[styles.label, { fontSize: 16, marginTop: 24 }]}>For nurses and aides</Text>
      <View style={styles.card}>
        <Text style={styles.p}>See open shifts for your role, with your own pay rate and any bonus before you claim.</Text>
        <Text style={styles.p}>Apply once. We check your license and references, run a background check with your permission, then you are cleared to pick up shifts.</Text>
      </View>

      <Text style={[styles.label, { fontSize: 16 }]}>For facilities</Text>
      <View style={styles.card}>
        <Text style={styles.p}>Post the shifts you need and the rate you will pay. Verified staff claim them, and we confirm each claim.</Text>
        <Text style={styles.p}>Raise a bonus on a hard-to-fill shift in a few taps.</Text>
      </View>

      <Text style={[styles.label, { fontSize: 16 }]}>What a shift looks like</Text>
      {EXAMPLES.map((s) => (
        <View key={s.role} style={styles.card}>
          <Text style={{ fontWeight: "700", color: colors.green }}>{s.role}</Text>
          <Text style={styles.p}>{s.when}</Text>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            {s.was ? <Text style={{ textDecorationLine: "line-through", fontWeight: "400" }}>{s.was}  </Text> : null}
            {s.pay}
          </Text>
          {s.note ? <Text style={styles.p}>{s.note}</Text> : null}
          <Text style={styles.p}>{s.total}</Text>
        </View>
      ))}
      <Text style={[styles.p, { fontSize: 13 }]}>
        Example shifts to show the layout. Real rates are set by each facility, and we confirm every claim before it counts.
      </Text>

      <Button title="Apply today" onPress={onApply} />
      <Button title="Sign in" secondary onPress={onSignIn} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

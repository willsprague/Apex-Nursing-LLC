import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Button, ShiftCard, TabBar, colors, serif, styles } from "./ui";

// Public home. Anyone can browse before signing in, so they can see what Apixora is.
// The shifts here are examples that show the layout, not live shifts: real ones need an account.
const EXAMPLES = [
  { role: "Licensed Practical Nurse", when: "Sun · 3:00 PM to 11:00 PM", base: "38.00", rate: "43.00", bonus: "5.00", total: "344" },
  { role: "Licensed Nursing Assistant", when: "Sat · 7:00 AM to 3:00 PM", rate: "24.00", total: "192", pill: "2 of 2 open" },
  { role: "Registered Nurse", when: "Mon · 11:00 PM to 7:00 AM", rate: "52.00", total: "416", pill: "1 of 1 open" },
];
const NOTE = "Example shifts to show the layout. Real rates are set by each facility, and we confirm every claim before it counts.";
const STEPS = [
  ["1", "Apply free", "License, work history and references"],
  ["2", "Get cleared", "Background check, then a physical and TB test"],
  ["3", "Claim shifts", "Pay and total shown before you claim"],
];

export default function Landing({ onSignIn, onApply, onFacility }) {
  const [tab, setTab] = useState("home");
  const change = (k) => (k === "signin" ? onSignIn() : setTab(k));
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontFamily: serif, fontSize: 28, fontWeight: "700", color: colors.green }}>Apixora</Text>
          <Button title="Sign in" secondary onPress={onSignIn} />
        </View>

        {tab === "home" ? (
          <>
            <Text style={styles.eyebrow}>New Hampshire · Long-term care</Text>
            <Text style={[styles.h1, { fontSize: 38, lineHeight: 40 }]}>Shifts filled by people you can verify.</Text>
            <Text style={styles.p}>Look around first. See the pay and the total for every shift before you create an account.</Text>
            <Button title="Apply to work" onPress={onApply} />
            <Button title="I need to cover a shift" secondary onPress={onFacility} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={styles.h2}>Open shifts</Text>
              <Text onPress={() => setTab("shifts")} accessibilityRole="button" style={{ color: colors.green, fontWeight: "700", fontSize: 15 }}>See all</Text>
            </View>
            {EXAMPLES.slice(0, 2).map((s) => <ShiftCard key={s.role} s={s} onPress={() => setTab("shifts")} />)}
            <Text style={[styles.muted, { fontSize: 12, marginBottom: 8 }]}>{NOTE}</Text>

            <Text style={styles.h2}>How it works</Text>
            {STEPS.map(([n, t, d]) => (
              <View key={n} style={[styles.card, { flexDirection: "row", gap: 14, alignItems: "center" }]}>
                <Text style={{ fontFamily: serif, fontSize: 28, fontWeight: "700", color: colors.goldText, width: 24 }}>{n}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 16 }}>{t}</Text>
                  <Text style={styles.muted}>{d}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.h2}>For facilities</Text>
            <View style={styles.card}>
              <Text style={styles.p}>Post the shifts you need and the rate you will pay. Verified staff claim them, and we confirm each claim. Add a bonus on a hard-to-fill shift in a few taps.</Text>
              <Button title="Post a shift" secondary onPress={onFacility} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.h1}>Open shifts</Text>
            <Text style={styles.p}>This is what workers see once they are cleared. The rate and the total come first.</Text>
            {EXAMPLES.map((s) => <ShiftCard key={s.role} s={s} />)}
            <Text style={[styles.muted, { fontSize: 12 }]}>{NOTE}</Text>
            <Button title="Apply to work" onPress={onApply} />
          </>
        )}
      </ScrollView>
      <TabBar tab={tab} onChange={change} items={[["home", "Home"], ["shifts", "Browse shifts"], ["signin", "Sign in"]]} />
    </View>
  );
}

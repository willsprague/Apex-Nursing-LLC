import { View, Text, ScrollView } from "react-native";
import { supabase } from "./supabase";
import { Button, colors, styles } from "./ui";
import { STAGES } from "./options";

// Main page for an applicant: where they stand, what happens next, and how Apixora works.
export default function Home({ app, onStatus }) {
  const idx = STAGES.findIndex(([k]) => k === app.status);
  const declined = app.status === "declined";
  const current = idx >= 0 ? STAGES[idx][1] : STAGES[0][1];
  const next = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1][1] : null;
  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.h1}>Hi {app.full_name.split(" ")[0]}</Text>
      <Text style={styles.p}>Welcome to Apixora. Here is where you stand.</Text>
      {!declined && (
        <View style={styles.card}>
          <Text style={{ fontWeight: "700", color: colors.green }}>Your application: {current}</Text>
          {next && <Text style={styles.p}>Next: {next}</Text>}
          <Button title="See my application status" onPress={onStatus} />
        </View>
      )}
      {declined && (
        <View style={styles.card}>
          <Text style={styles.p}>Thank you for applying. We are not able to move your application forward right now.</Text>
        </View>
      )}
      <Text style={[styles.label, { fontSize: 16, marginTop: 16 }]}>How it works</Text>
      <View style={styles.card}>
        <Text style={styles.p}>1. We check your license and professional references, then run a background check with your written permission.</Text>
        <Text style={styles.p}>2. When you are approved, an urgent care partner does your physical and TB test.</Text>
        <Text style={styles.p}>3. Once you are cleared, you create your worker account here and see open shifts for your role, with your own pay shown up front.</Text>
        <Text style={styles.p}>4. You claim the shifts you want. We confirm each one, then you work.</Text>
      </View>
      <Text style={styles.p}>Shifts open to you after you are cleared. Until then, this page and your status are what you will see.</Text>
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

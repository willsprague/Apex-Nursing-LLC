import { View, Text, ScrollView } from "react-native";
import { Button, colors, styles } from "./ui";
import { STAGES } from "./options";

// Main page for an applicant: where they stand, what happens next, and how Apixora works.
export default function Home({ app, onStatus }) {
  const idx = Math.max(0, STAGES.findIndex(([k]) => k === app.status));
  const declined = app.status === "declined";
  const next = idx < STAGES.length - 1 ? STAGES[idx + 1][1] : null;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.muted}>Welcome back</Text>
      <Text style={styles.h1}>Hi {app.full_name.split(" ")[0]}</Text>
      {declined ? (
        <View style={styles.card}>
          <Text style={styles.p}>Thank you for applying. We are not able to move your application forward right now.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: colors.green, borderRadius: 18, padding: 18, marginBottom: 12 }}>
          <Text style={{ color: "#e9d9a8", fontSize: 12, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" }}>
            Step {idx + 1} of {STAGES.length}
          </Text>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 6 }}>{STAGES[idx][1]}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginVertical: 12 }}>
            {STAGES.map(([k], i) => (
              <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= idx ? "#e9d9a8" : "#4d7a66" }} />
            ))}
          </View>
          {next && <Text style={{ color: "#e8efe9", fontSize: 15, marginBottom: 4 }}>Next: {next}</Text>}
          <Button title="See full status" secondary onPress={onStatus} />
        </View>
      )}
      <Text style={styles.h2}>While you wait</Text>
      <View style={styles.card}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>Keep your references ready</Text>
        <Text style={styles.muted}>We contact two professional references. Let them know to expect us.</Text>
      </View>
      <View style={styles.card}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>What comes next</Text>
        <Text style={styles.muted}>After approval, a physical and TB test at an urgent care partner. Then you are cleared to claim shifts.</Text>
      </View>
      <View style={styles.card}>
        <Text style={{ fontWeight: "700", fontSize: 16 }}>Shifts open after you are cleared</Text>
        <Text style={styles.muted}>You will see open shifts for your role, with your own pay and the shift total shown first.</Text>
      </View>
    </ScrollView>
  );
}

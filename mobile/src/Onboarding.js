import { useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "./supabase";
import { Button, Field, styles } from "./ui";

export default function Onboarding({ user, onDone }) {
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if (!role || !name.trim()) return setMsg("Choose an option and enter your name.");
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, role, display_name: name.trim().slice(0, 100) });
    setBusy(false);
    if (error) return setMsg("Could not save your account. Try again.");
    onDone();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Welcome</Text>
      <Text style={styles.p}>How will you use Apixora? You cannot change this later.</Text>
      <Button title="I need home care" secondary={role !== "poster"} onPress={() => setRole("poster")} />
      <Button title="I am a nurse or caregiver" secondary={role !== "nurse"} onPress={() => setRole("nurse")} />
      <Text style={styles.label}>Your name (only staff will see it)</Text>
      <Field value={name} onChangeText={setName} placeholder="Full name" autoComplete="name" />
      <Button title={busy ? "Saving..." : "Continue"} onPress={save} disabled={busy} />
      {!!msg && <Text style={styles.error}>{msg}</Text>}
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { supabase } from "./supabase";
import { Button, Field, styles } from "./ui";

const TYPES = ["Personal care", "Skilled nursing", "Companion care", "Overnight care", "Other"];

export default function Poster({ profile }) {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("care_listings")
      .select("id, town, care_type, schedule, hourly_rate, status")
      .order("created_at", { ascending: false });
    setListings(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    const rate = Number(form.rate);
    if (!form.town.trim() || !form.type || !form.schedule.trim() || !(rate >= 10 && rate <= 200)) {
      return setMsg("Fill in town, type of care, schedule, and an hourly rate from 10 to 200.");
    }
    const { error } = await supabase.from("care_listings").insert({
      poster_id: profile.id,
      town: form.town.trim(),
      care_type: form.type,
      schedule: form.schedule.trim(),
      hourly_rate: rate,
      details: form.details.trim().slice(0, 500),
    });
    if (error) return setMsg("Listing not saved. Your account may not be verified yet.");
    setForm(null);
    setMsg("Listing sent for review. It appears to nurses once approved.");
    load();
  }

  async function close(id) {
    await supabase.from("care_listings").update({ status: "closed" }).eq("id", id);
    load();
  }

  if (form) {
    return (
      <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>New listing</Text>
        <Text style={styles.p}>
          Nurses will see this. Do not include names, street addresses, phone numbers or health details.
        </Text>
        <Text style={styles.label}>Town</Text>
        <Field value={form.town} onChangeText={(v) => setForm({ ...form, town: v })} />
        <Text style={styles.label}>Type of care</Text>
        {TYPES.map((t) => (
          <Button key={t} title={t} secondary={form.type !== t} onPress={() => setForm({ ...form, type: t })} />
        ))}
        <Text style={styles.label}>Schedule (days and hours)</Text>
        <Field value={form.schedule} onChangeText={(v) => setForm({ ...form, schedule: v })} />
        <Text style={styles.label}>Hourly rate in dollars</Text>
        <Field value={form.rate} onChangeText={(v) => setForm({ ...form, rate: v })} keyboardType="decimal-pad" />
        <Text style={styles.label}>Details (optional)</Text>
        <Field value={form.details} onChangeText={(v) => setForm({ ...form, details: v })}
          multiline maxLength={500} style={{ minHeight: 90 }} />
        {!!msg && <Text style={styles.error}>{msg}</Text>}
        <Button title="Submit for review" onPress={submit} />
        <Button title="Cancel" secondary onPress={() => { setForm(null); setMsg(""); }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.h1}>Your listings</Text>
      {!profile.verified && (
        <Text style={styles.p}>
          Your account is waiting for verification. You can post once staff have confirmed your identity.
        </Text>
      )}
      {!!msg && <Text style={styles.p}>{msg}</Text>}
      <Button title="Post a care need" disabled={!profile.verified}
        onPress={() => { setMsg(""); setForm({ town: "", type: "", schedule: "", rate: "", details: "" }); }} />
      <View style={{ height: 16 }} />
      {listings.map((l) => (
        <View key={l.id} style={styles.card}>
          <Text style={styles.label}>{l.town}: {l.care_type}</Text>
          <Text style={styles.p}>${l.hourly_rate}/hr. {l.schedule}. Status: {l.status}</Text>
          {(l.status === "pending" || l.status === "approved") && (
            <Button title="Close listing" secondary onPress={() => close(l.id)} />
          )}
        </View>
      ))}
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}

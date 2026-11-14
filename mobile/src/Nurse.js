import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { supabase } from "./supabase";
import { Button, styles } from "./ui";

export default function Nurse({ profile }) {
  const [listings, setListings] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const { data } = await supabase
      .from("care_listings")
      .select("id, town, care_type, schedule, hourly_rate, details")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setListings(data || []);
    setBusy(false);
  }, []);
  useEffect(() => { if (profile.verified) load(); }, [profile.verified, load]);

  return (
    <ScrollView style={styles.screen}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      <Text style={styles.h1}>Open care listings</Text>
      {!profile.verified ? (
        <Text style={styles.p}>
          Your account is waiting for verification. Staff will check your nursing license, then listings appear here.
        </Text>
      ) : listings.length === 0 ? (
        <Text style={styles.p}>No open listings right now. Pull down to refresh.</Text>
      ) : (
        listings.map((l) => (
          <View key={l.id} style={styles.card}>
            <Text style={styles.label}>{l.town}: {l.care_type}</Text>
            <Text style={styles.p}>${l.hourly_rate}/hr. {l.schedule}</Text>
            {!!l.details && <Text style={styles.p}>{l.details}</Text>}
          </View>
        ))
      )}
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}

import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { supabase } from "./supabase";
import { Button, friendly, styles, when } from "./ui";

const LABEL = { claimed: "Waiting for our confirmation", confirmed: "Confirmed" };
const hours = (a, b) => Math.round(((new Date(b) - new Date(a)) / 3600000) * 100) / 100;

function Pay({ s }) {
  const bonus = Number(s.bonus_pay) > 0;
  return (
    <Text style={styles.p}>
      You earn {bonus ? <Text style={{ textDecorationLine: "line-through", opacity: 0.6 }}>${s.base_rate}/hr </Text> : null}
      <Text style={{ fontWeight: "700" }}>${s.total_rate}/hr</Text>
      {bonus ? ` (includes a $${s.bonus_pay}/hr facility bonus)` : ""}.{"\n"}
      About ${s.total_pay} total for {hours(s.starts_at, s.ends_at)} hours.
    </Text>
  );
}

export default function Worker({ me }) {
  const [open, setOpen] = useState([]);
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    const [a, b] = await Promise.all([supabase.rpc("worker_open_shifts"), supabase.rpc("worker_my_claims")]);
    setOpen(a.data || []);
    setMine(b.data || []);
    setBusy(false);
  }, []);
  useEffect(() => { if (me.verified) load(); }, [me.verified, load]);

  async function run(fn, args, fallback) {
    setMsg("");
    const { error } = await supabase.rpc(fn, args);
    if (error) setMsg(friendly(error, fallback));
    load();
  }

  if (!me.verified) {
    return (
      <View style={styles.screen}>
        <Text style={styles.h1}>Welcome, {me.display_name}</Text>
        <Text style={styles.p}>Thanks. We are checking your license and will email you when you can claim shifts.</Text>
        <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      <Text style={styles.h1}>Open shifts for {me.role}</Text>
      {!!msg && <Text style={styles.error} accessibilityRole="alert">{msg}</Text>}
      {open.length === 0 && <Text style={styles.p}>No open shifts right now. Pull down to refresh.</Text>}
      {open.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.label}>{s.facility_type}</Text>
          <Text style={styles.p}>{when(s.starts_at)} to {when(s.ends_at)}</Text>
          <Pay s={s} />
          <Text style={styles.p}>{s.spots_left} of {s.headcount} spot{s.headcount === 1 ? "" : "s"} open.</Text>
          {!!s.notes && <Text style={styles.p}>{s.notes}</Text>}
          <Button title="Claim shift" onPress={() => run("claim_shift", { p_shift: s.id }, "Could not claim this shift. Try again.")} />
        </View>
      ))}
      <Text style={styles.p}>We confirm each claim before it counts, and tell you the facility name once it is confirmed.</Text>

      <Text style={[styles.h1, { marginTop: 24 }]}>Your shifts</Text>
      {mine.length === 0 && <Text style={styles.p}>You have not claimed any shifts yet.</Text>}
      {mine.map((c) => (
        <View key={c.claim_id} style={styles.card}>
          <Text style={styles.label}>{c.facility_name || c.facility_type}</Text>
          <Text style={styles.p}>{when(c.starts_at)} to {when(c.ends_at)}</Text>
          <Pay s={c} />
          <Text style={styles.p}>
            {LABEL[c.claim_status] || c.claim_status}{c.shift_status === "cancelled" ? " (cancelled)" : ""}
          </Text>
          <Button title="Withdraw" secondary onPress={() => run("withdraw_claim", { p_claim: c.claim_id }, "Could not withdraw. Try again.")} />
        </View>
      ))}
      <Text style={styles.p}>Confirmed shifts can be withdrawn more than 24 hours before they start. Closer than that, contact us.</Text>
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

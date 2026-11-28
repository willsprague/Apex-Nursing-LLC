import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { supabase } from "./supabase";
import { Button, ShiftCard, TabBar, colors, friendly, styles, when } from "./ui";

const LABEL = { claimed: "Waiting for our confirmation", confirmed: "Confirmed" };
const hours = (a, b) => Math.round(((new Date(b) - new Date(a)) / 3600000) * 100) / 100;

// Map a shift row from the database to what ShiftCard shows. Pay comes first.
const card = (s, footer, pill) => ({
  role: s.role || s.facility_name || s.facility_type,
  when: `${when(s.starts_at)} to ${when(s.ends_at)} · ${hours(s.starts_at, s.ends_at)} hrs`,
  base: s.base_rate, rate: s.total_rate, bonus: s.bonus_pay, total: s.total_pay, footer, pill,
});

export default function Worker({ me }) {
  const [tab, setTab] = useState("shifts");
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

  const refresh = <RefreshControl refreshing={busy} onRefresh={load} />;
  let body;
  if (tab === "shifts") {
    body = (
      <ScrollView style={styles.screen} refreshControl={refresh} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.eyebrow}>{me.role}</Text>
        <Text style={styles.h1}>Open shifts</Text>
        {!!msg && <Text style={styles.error} accessibilityRole="alert">{msg}</Text>}
        {open.length === 0 && <Text style={styles.p}>No open shifts right now. Pull down to refresh.</Text>}
        {open.map((s) => (
          <ShiftCard key={s.id} s={card({ ...s, facility_name: null }, [s.notes].filter(Boolean).join(" · ") || undefined,
            `${s.spots_left} of ${s.headcount} open`)}>
            <Button title="Claim this shift" onPress={() => run("claim_shift", { p_shift: s.id }, "Could not claim this shift. Try again.")} />
          </ShiftCard>
        ))}
        <Text style={styles.muted}>We confirm each claim before it counts, and tell you the facility name once it is confirmed.</Text>
      </ScrollView>
    );
  } else if (tab === "mine") {
    body = (
      <ScrollView style={styles.screen} refreshControl={refresh} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.h1}>My shifts</Text>
        {!!msg && <Text style={styles.error} accessibilityRole="alert">{msg}</Text>}
        {mine.length === 0 && <Text style={styles.p}>You have not claimed any shifts yet.</Text>}
        {mine.map((c) => (
          <ShiftCard key={c.claim_id}
            s={card(c, `${LABEL[c.claim_status] || c.claim_status}${c.shift_status === "cancelled" ? " (cancelled)" : ""}`,
              c.claim_status === "confirmed" ? "Confirmed" : "Pending")}>
            <Button title="Withdraw" secondary onPress={() => run("withdraw_claim", { p_claim: c.claim_id }, "Could not withdraw. Try again.")} />
          </ShiftCard>
        ))}
        <Text style={styles.muted}>Confirmed shifts can be withdrawn more than 24 hours before they start. Closer than that, contact us.</Text>
      </ScrollView>
    );
  } else {
    body = (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.h1}>{me.display_name}</Text>
        <Text style={styles.muted}>{me.role}</Text>
        <View style={{ backgroundColor: colors.mint, borderRadius: 12, padding: 12, marginVertical: 14 }}>
          <Text style={{ color: colors.green, fontWeight: "700", fontSize: 15 }}>Cleared to claim shifts</Text>
        </View>
        <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      </ScrollView>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flex: 1 }}>{body}</View>
      <TabBar tab={tab} onChange={setTab} items={[["shifts", "Shifts"], ["mine", "My shifts"], ["profile", "Profile"]]} />
    </View>
  );
}

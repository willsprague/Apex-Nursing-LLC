import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { supabase } from "./supabase";
import { Button, Choice, Field, colors, friendly, styles } from "./ui";
import { STAGES } from "./options";

export default function Status({ app, onChanged }) {
  const [busy, setBusy] = useState(false);
  const idx = STAGES.findIndex(([k]) => k === app.status);
  const declined = app.status === "declined";

  async function refresh() {
    setBusy(true);
    await onChanged();
    setBusy(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} />}>
      <Text style={styles.h1}>{declined ? "Your application" : "Application status"}</Text>
      {declined ? (
        <Text style={styles.p}>
          Thank you for applying. We are not able to move your application forward right now.
        </Text>
      ) : (
        <>
          <Text style={styles.p}>Thanks, {app.full_name}. We will update this page as you move forward. Pull down to refresh.</Text>
          <View style={[styles.card, { paddingVertical: 18 }]}>
            {[["account", "Account created"], ...STAGES].map(([k, label], j) => {
              const i = j - 1; // -1 is the account row, always done
              const done = i < idx, now = i === idx, last = j === STAGES.length;
              return (
                <View key={k} style={{ flexDirection: "row", gap: 14 }}>
                  <View style={{ alignItems: "center" }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
                      backgroundColor: done ? colors.green : "#fff", borderWidth: now ? 3 : done ? 0 : 2,
                      borderColor: now ? colors.gold : "#cfc7b2" }}>
                      {done ? <Text style={{ color: "#fff", fontWeight: "700" }}>✓</Text> : null}
                    </View>
                    {!last && <View style={{ width: 2, height: 24, backgroundColor: done ? colors.green : "#d8d0bd" }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: done || now ? colors.ink : colors.muted }}>{label}</Text>
                    {now ? <Text style={styles.muted}>In progress</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
          {app.status === "approved" && (
            <Text style={styles.p}>You are approved. Next is a physical and TB test at an urgent care. We will send details.</Text>
          )}
          {app.status === "cleared" && <RegisterWorker onDone={onChanged} />}
        </>
      )}
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}

// Cleared applicants create their worker account here and can then claim shifts.
function RegisterWorker({ onDone }) {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const { data } = await supabase.from("shift_roles").select("role").order("role");
    setRoles((data || []).map((r) => r.role));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!name.trim() || !role || !license.trim()) return setMsg("Enter your name, role and license number.");
    setBusy(true);
    const { error } = await supabase.rpc("register_worker", { p_name: name, p_role: role, p_license: license });
    setBusy(false);
    if (error) return setMsg(friendly(error, "Could not save your account. Try again."));
    onDone();
  }
  return (
    <View>
      <Text style={styles.p}>You are cleared. Create your worker account to see and claim shifts.</Text>
      <Text style={styles.label}>Name</Text>
      <Field value={name} onChangeText={setName} />
      <Text style={styles.label}>Role</Text>
      <Choice options={roles} value={role} onChange={setRole} />
      <Text style={styles.label}>License number</Text>
      <Field value={license} onChangeText={setLicense} autoCapitalize="characters" />
      {!!msg && <Text style={styles.error}>{msg}</Text>}
      <Button title={busy ? "Saving..." : "Create worker account"} onPress={save} disabled={busy} />
    </View>
  );
}

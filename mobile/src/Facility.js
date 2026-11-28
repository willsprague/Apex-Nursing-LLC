import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { supabase } from "./supabase";
import { Button, Choice, Field, friendly, styles, when } from "./ui";
import { FACILITY_TYPES, UNIT_TYPES } from "./options";

export default function Facility({ user }) {
  const [facility, setFacility] = useState(undefined);
  const load = useCallback(async () => {
    const { data } = await supabase.from("facilities").select("id, name, verified").eq("owner_id", user.id).maybeSingle();
    setFacility(data || null);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  if (facility === undefined) return <View style={styles.screen} />;
  if (!facility) return <Register onDone={load} />;
  if (!facility.verified) {
    return (
      <View style={styles.screen}>
        <Text style={styles.h1}>{facility.name}</Text>
        <Text style={styles.p}>Thanks. We are verifying your facility and will email you when you can post shifts.</Text>
        <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      </View>
    );
  }
  return <Shifts facility={facility} />;
}

function Register({ onDone }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function save() {
    if (!name.trim() || !type || !contact.trim()) return setMsg("Fill in the facility name, type and your name.");
    setBusy(true);
    const { error } = await supabase.rpc("register_facility", { p_name: name, p_type: type, p_contact: contact });
    setBusy(false);
    if (error) return setMsg(friendly(error, "Could not save your facility. Try again."));
    onDone();
  }
  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Register your facility</Text>
      <Text style={styles.p}>We verify every facility before it can post shifts.</Text>
      <Text style={styles.label}>Facility name</Text>
      <Field value={name} onChangeText={setName} />
      <Text style={styles.label}>Type</Text>
      <Choice options={FACILITY_TYPES} value={type} onChange={setType} />
      <Text style={styles.label}>Your name</Text>
      <Field value={contact} onChangeText={setContact} autoComplete="name" />
      {!!msg && <Text style={styles.error}>{msg}</Text>}
      <Button title={busy ? "Saving..." : "Register"} onPress={save} disabled={busy} />
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}

function Shifts({ facility }) {
  const [roles, setRoles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [bonus, setBonus] = useState({});
  const [units, setUnits] = useState([]);
  const [u, setU] = useState({ name: "", floor: "", type: "Memory care", patients: "" });
  const [f, setF] = useState({ role: "", date: "", start: "07:00", end: "15:00", people: "1", unit: "", ratio: "", aides: "", rate: "", notes: "" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setBusy(true);
    const [r, s, un] = await Promise.all([
      supabase.from("shift_roles").select("role, min_bill_rate").order("role"),
      supabase.from("shifts")
        .select("id, role, starts_at, ends_at, bill_rate, bonus_rate, status, notes, ratio_to, facility_units(name)")
        .order("starts_at", { ascending: false }).limit(100),
      supabase.from("facility_units").select("id, name, floor, unit_type, patients").order("name"),
    ]);
    setUnits(un.data || []);
    setRoles(r.data || []);
    setShifts(s.data || []);
    setBusy(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveUnit() {
    setMsg("");
    const { error } = await supabase.rpc("add_unit", {
      p_name: u.name, p_floor: u.floor, p_type: u.type, p_patients: Number(u.patients),
    });
    if (error) return setMsg(friendly(error, "The unit was not saved. Try again."));
    setU({ name: "", floor: "", type: "Memory care", patients: "" });
    load();
  }

  async function post() {
    setMsg("");
    const people = Number(f.people), rate = Number(f.rate), ratio = Number(f.ratio);
    if (!f.role || !/^\d{4}-\d{2}-\d{2}$/.test(f.date) || !/^\d{2}:\d{2}$/.test(f.start) || !/^\d{2}:\d{2}$/.test(f.end)) {
      return setMsg("Choose a role, then enter the date as YYYY-MM-DD and times as HH:MM (24 hour, Eastern).");
    }
    if (!Number.isInteger(people) || !(rate > 0)) return setMsg("Enter how many people you need and an hourly rate.");
    if (!f.unit) return setMsg("Choose the unit, or add one first.");
    if (!Number.isInteger(ratio) || ratio < 1 || ratio > 99) return setMsg("Enter the ratio as patients per nurse (1 to 99).");
    const { error } = await supabase.rpc("create_shift", {
      p_role: f.role, p_date: f.date, p_start: f.start, p_end: f.end,
      p_people: people, p_bill_rate: rate, p_notes: f.notes.trim(),
      p_unit: f.unit, p_ratio: ratio, p_aides: f.aides === "" ? null : Number(f.aides),
    });
    if (error) return setMsg(friendly(error, "The shift was not saved. Try again."));
    setF((p) => ({ ...p, date: "", rate: "", notes: "" }));
    load();
  }

  async function act(fn, args, fallback) {
    setMsg("");
    const { error } = await supabase.rpc(fn, args);
    if (error) setMsg(friendly(error, fallback));
    load();
  }

  const min = roles.find((r) => r.role === f.role)?.min_bill_rate;
  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      <Text style={styles.h1}>{facility.name}</Text>
      <Text style={styles.h2}>Your units</Text>
      {units.map((x) => <Text key={x.id} style={styles.p}>{x.name}{x.floor ? `, ${x.floor}` : ""}: {x.unit_type}, {x.patients} patients</Text>)}
      <Text style={styles.label}>Add a unit</Text>
      <Field value={u.name} onChangeText={(v) => setU((p) => ({ ...p, name: v }))} placeholder="Unit name (Lee Unit)" />
      <Field style={{ marginTop: 8 }} value={u.floor} onChangeText={(v) => setU((p) => ({ ...p, floor: v }))} placeholder="Floor (2nd floor)" />
      <Choice options={UNIT_TYPES} value={u.type} onChange={(v) => setU((p) => ({ ...p, type: v }))} />
      <Field style={{ marginTop: 8 }} value={u.patients} onChangeText={(v) => setU((p) => ({ ...p, patients: v }))} placeholder="Patients on the unit" keyboardType="number-pad" />
      <Button title="Save unit" secondary onPress={saveUnit} />
      <Text style={styles.h2}>Post a shift</Text>
      <Choice options={roles.map((r) => r.role)} value={f.role} onChange={set("role")} />
      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <Field value={f.date} onChangeText={set("date")} placeholder="2026-12-01" autoCapitalize="none" />
      <Text style={styles.label}>Start and end (24 hour, Eastern)</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Field style={{ flex: 1 }} value={f.start} onChangeText={set("start")} />
        <Field style={{ flex: 1 }} value={f.end} onChangeText={set("end")} />
      </View>
      <Text style={styles.label}>Unit</Text>
      {units.length === 0 && <Text style={styles.muted}>Add a unit below first.</Text>}
      <Choice options={units.map((x) => x.name)} value={units.find((x) => x.id === f.unit)?.name || ""}
        onChange={(n) => set("unit")(units.find((x) => x.name === n)?.id || "")} />
      <Text style={styles.label}>Ratio: patients per nurse</Text>
      <Field value={f.ratio} onChangeText={set("ratio")} keyboardType="number-pad" placeholder="14" />
      <Text style={styles.label}>Aides on this shift (optional)</Text>
      <Field value={f.aides} onChangeText={set("aides")} keyboardType="number-pad" />
      <Text style={styles.label}>People needed (each is a separate shift)</Text>
      <Field value={f.people} onChangeText={set("people")} keyboardType="number-pad" />
      <Text style={styles.label}>Hourly rate you pay{min ? ` (at least $${Math.max(Number(min), 10)})` : ""}</Text>
      <Field value={f.rate} onChangeText={set("rate")} keyboardType="decimal-pad" />
      <Text style={styles.label}>Notes (optional)</Text>
      <Field value={f.notes} onChangeText={set("notes")} maxLength={300} />
      {!!msg && <Text style={styles.error} accessibilityRole="alert">{msg}</Text>}
      <Button title="Post shift" onPress={post} />

      <Text style={[styles.h1, { marginTop: 24 }]}>Your shifts</Text>
      {shifts.length === 0 && <Text style={styles.p}>No shifts yet.</Text>}
      {shifts.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.label}>{s.role}{s.facility_units?.name ? ` · ${s.facility_units.name}` : ""}{s.ratio_to ? ` · 1 to ${s.ratio_to}` : ""}</Text>
          <Text style={styles.p}>{when(s.starts_at)} to {when(s.ends_at)}</Text>
          <Text style={styles.p}>
            You pay ${s.bill_rate}/hr{Number(s.bonus_rate) > 0 ? ` plus a $${s.bonus_rate}/hr bonus` : ""}. Status: {s.status}
          </Text>
          {s.status === "open" && (
            <>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Field style={{ flex: 1 }} placeholder="Bonus $/hr" keyboardType="decimal-pad"
                  value={bonus[s.id] || ""} onChangeText={(v) => setBonus((p) => ({ ...p, [s.id]: v }))} />
                <Button title={Number(s.bonus_rate) > 0 ? "Raise bonus" : "Add bonus"} secondary
                  onPress={() => {
                    const b = Number(bonus[s.id]);
                    if (!(b > 0)) return setMsg("Enter a bonus amount in dollars per hour.");
                    act("add_shift_bonus", { p_shift: s.id, p_bonus: b }, "Could not add the bonus. Try again.");
                  }} />
              </View>
              <Button title="Cancel shift" secondary onPress={() => act("cancel_shift", { p_id: s.id }, "Could not cancel the shift. Try again.")} />
            </>
          )}
        </View>
      ))}
      <Text style={styles.p}>A bonus is paid on top of your rate and can be raised but not lowered. Shifts can be cancelled more than 24 hours before they start.</Text>
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

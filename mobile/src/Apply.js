import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { supabase } from "./supabase";
import { Button, Choice, Field, friendly, styles } from "./ui";
import {
  APPLY_ROLES, EXPERIENCE, ID_TYPES, SETTINGS, AVAILABILITY, REFERENCE_RELATIONSHIPS,
} from "./options";

export default function Apply({ onDone }) {
  const [f, setF] = useState({
    name: "", phone: "", role: "", licenseState: "NH", license: "", experience: "", town: "",
    disciplined: "", idTypes: [], settings: [], availability: [],
    ref1Name: "", ref1Rel: "", ref1Contact: "", ref2Name: "", ref2Rel: "", ref2Contact: "",
    consent: false, referenceConsent: false,
    job1Employer: "", job1Title: "", job1From: "", job1To: "",
    job2Employer: "", job2Title: "", job2From: "", job2To: "",
    job3Employer: "", job3Title: "", job3From: "", job3To: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  async function send() {
    const need = [f.name, f.phone, f.role, f.licenseState, f.license, f.experience, f.town,
      f.disciplined, f.ref1Name, f.ref1Rel, f.ref1Contact, f.ref2Name, f.ref2Rel, f.ref2Contact];
    if (need.some((v) => !String(v).trim()) || !f.idTypes.length || !f.settings.length || !f.availability.length) {
      return setMsg("Fill in every question, then send the application again.");
    }
    const jobs = [1, 2, 3].map((n) => ({
      employer: f[`job${n}Employer`].trim(), title: f[`job${n}Title`].trim(),
      from: f[`job${n}From`].trim(), to: f[`job${n}To`].trim(),
    }));
    const started = jobs.filter((j) => j.employer || j.title || j.from || j.to);
    if (!jobs[0].employer || !jobs[0].title || !jobs[0].from || !jobs[0].to) {
      return setMsg("Add your most recent job with the employer, job title, and when you started and ended.");
    }
    if (started.some((j) => !j.employer || !j.title || !j.from || !j.to)) {
      return setMsg("Finish each job you started: employer, job title, start and end.");
    }
    if (!f.consent) return setMsg("Check the box so we can contact you and look up your license.");
    if (!f.referenceConsent) return setMsg("Check the box so we can contact your references and past employers.");
    setBusy(true);
    const { error } = await supabase.rpc("submit_application", {
      p: {
        full_name: f.name, phone: f.phone, role: f.role, license_state: f.licenseState,
        license_number: f.license, years_experience: f.experience, town: f.town,
        license_disciplined: f.disciplined === "yes", id_types: f.idTypes.join(", "),
        ref1_name: f.ref1Name, ref1_relationship: f.ref1Rel, ref1_contact: f.ref1Contact,
        ref2_name: f.ref2Name, ref2_relationship: f.ref2Rel, ref2_contact: f.ref2Contact,
        settings: f.settings.join(", "), availability: f.availability.join(", "), consent: true,
        work_history: started, reference_consent: true,
      },
    });
    setBusy(false);
    if (error) return setMsg(friendly(error, "Your application was not saved. Try again in a minute."));
    onDone();
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Apply today</Text>
      <Text style={styles.p}>
        This is our formal application. We do not ask for your Social Security number or ID photos here.
      </Text>
      <Text style={styles.label}>Full name</Text>
      <Field value={f.name} onChangeText={set("name")} autoComplete="name" />
      <Text style={styles.label}>Phone</Text>
      <Field value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" />
      <Text style={styles.label}>Town</Text>
      <Field value={f.town} onChangeText={set("town")} />
      <Text style={styles.label}>Credential type</Text>
      <Choice options={APPLY_ROLES} value={f.role} onChange={set("role")} />
      <Text style={styles.label}>License state</Text>
      <Field value={f.licenseState} onChangeText={set("licenseState")} autoCapitalize="characters" />
      <Text style={styles.label}>License number</Text>
      <Field value={f.license} onChangeText={set("license")} autoCapitalize="characters" />
      <Text style={styles.label}>Has your license ever been disciplined?</Text>
      <Choice options={["yes", "no"]} value={f.disciplined} onChange={set("disciplined")} />
      <Text style={styles.label}>Experience</Text>
      <Choice options={EXPERIENCE} value={f.experience} onChange={set("experience")} />
      <Text style={styles.label}>Forms of ID you can show when hired</Text>
      <Choice multi options={ID_TYPES} value={f.idTypes} onChange={set("idTypes")} />
      <Text style={[styles.label, { marginTop: 18, fontSize: 16 }]}>Work history</Text>
      <Text style={styles.p}>Your most recent job first. Add up to three. Month and year is fine, like Mar 2022.</Text>
      {[1, 2, 3].map((n) => (
        <View key={n}>
          <Text style={styles.label}>Job {n}{n > 1 ? " (optional)" : ""}</Text>
          <Field placeholder="Employer" value={f[`job${n}Employer`]} onChangeText={set(`job${n}Employer`)} />
          <Field placeholder="Job title" value={f[`job${n}Title`]} onChangeText={set(`job${n}Title`)} />
          <Field placeholder="Started (like Mar 2022)" value={f[`job${n}From`]} onChangeText={set(`job${n}From`)} />
          <Field placeholder="Ended, or Present" value={f[`job${n}To`]} onChangeText={set(`job${n}To`)} />
        </View>
      ))}
      <Text style={styles.label}>Where you want to work</Text>
      <Choice multi options={SETTINGS} value={f.settings} onChange={set("settings")} />
      <Text style={styles.label}>Availability</Text>
      <Choice multi options={AVAILABILITY} value={f.availability} onChange={set("availability")} />

      {[1, 2].map((n) => (
        <View key={n}>
          <Text style={[styles.label, { marginTop: 18, fontSize: 16 }]}>Professional reference {n}</Text>
          <Field placeholder="Name" value={f[`ref${n}Name`]} onChangeText={set(`ref${n}Name`)} />
          <Text style={styles.label}>Relationship</Text>
          <Choice options={REFERENCE_RELATIONSHIPS} value={f[`ref${n}Rel`]} onChange={set(`ref${n}Rel`)} />
          <Text style={styles.label}>Phone or email</Text>
          <Field value={f[`ref${n}Contact`]} onChangeText={set(`ref${n}Contact`)} autoCapitalize="none" />
        </View>
      ))}

      <Text style={[styles.label, { marginTop: 18 }]}>Consent</Text>
      <Choice options={["I agree that Apixora may contact me and look up my license and references."]}
        value={f.consent ? "I agree that Apixora may contact me and look up my license and references." : ""}
        onChange={() => set("consent")(!f.consent)} />
      <Choice options={["I agree that Apixora may contact my references and the past employers listed above."]}
        value={f.referenceConsent ? "I agree that Apixora may contact my references and the past employers listed above." : ""}
        onChange={() => set("referenceConsent")(!f.referenceConsent)} />
      {!!msg && <Text style={styles.error} accessibilityRole="alert">{msg}</Text>}
      <Button title={busy ? "Sending..." : "Send application"} onPress={send} disabled={busy} />
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

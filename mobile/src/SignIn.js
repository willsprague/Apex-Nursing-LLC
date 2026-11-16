import { useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "./supabase";
import { Button, Field, styles } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    const e = email.trim().toLowerCase();
    if (!EMAIL.test(e)) return setMsg("Enter a valid email address.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setMsg("Could not send the code. Try again in a minute.");
    setEmail(e);
    setSent(true);
    setMsg("");
  }

  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setMsg("That code did not work. Check it and try again.");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Apixora</Text>
      <Text style={styles.p}>
        {sent ? `Enter the code we emailed to ${email}.` : "Sign in with your email. No password needed."}
      </Text>
      {!sent ? (
        <>
          <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address"
            autoCapitalize="none" autoComplete="email" />
          <Button title={busy ? "Sending..." : "Email me a code"} onPress={send} disabled={busy} />
        </>
      ) : (
        <>
          <Field value={code} onChangeText={setCode} placeholder="Code" keyboardType="number-pad"
            autoComplete="one-time-code" maxLength={10} />
          <Button title={busy ? "Checking..." : "Sign in"} onPress={verify} disabled={busy} />
          <Button title="Use a different email" secondary onPress={() => { setSent(false); setCode(""); }} />
        </>
      )}
      {!!msg && <Text style={styles.error}>{msg}</Text>}
    </View>
  );
}

import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/supabase";
import SignIn from "./src/SignIn";
import Onboarding from "./src/Onboarding";
import Poster from "./src/Poster";
import Nurse from "./src/Nurse";
import { styles } from "./src/ui";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = none yet
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    setProfile(undefined);
    const { data, error: err } = await supabase
      .from("profiles").select("id, role, display_name, verified").eq("id", userId).maybeSingle();
    if (err) return setError(true);
    setError(false);
    setProfile(data);
  }

  useEffect(() => {
    if (session?.user) loadProfile(session.user.id);
    else setProfile(undefined);
  }, [session?.user?.id]);

  let screen;
  if (session === undefined) screen = <Loading />;
  else if (!session) screen = <SignIn />;
  else if (error) screen = <View style={styles.screen}><Text style={styles.p}>Could not load your account. Check your connection and reopen the app.</Text></View>;
  else if (profile === undefined) screen = <Loading />;
  else if (profile === null) screen = <Onboarding user={session.user} onDone={() => loadProfile(session.user.id)} />;
  else if (profile.role === "poster") screen = <Poster profile={profile} />;
  else screen = <Nurse profile={profile} />;

  return (
    <>
      <StatusBar style="dark" />
      {screen}
    </>
  );
}

function Loading() {
  return <View style={[styles.screen, { justifyContent: "center" }]}><ActivityIndicator /></View>;
}

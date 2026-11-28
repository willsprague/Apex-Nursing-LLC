import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import Apix from "./src/Apix";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/supabase";
import SignIn from "./src/SignIn";
import Landing from "./src/Landing";
import Welcome from "./src/Welcome";
import Apply from "./src/Apply";
import Status from "./src/Status";
import Home from "./src/Home";
import Worker from "./src/Worker";
import Facility from "./src/Facility";
import { TabBar, styles } from "./src/ui";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [me, setMe] = useState(undefined);            // { facility, worker, app } once loaded
  const [pick, setPick] = useState(null);             // "nurse" | "facility" chosen on the welcome screen
  const [error, setError] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false); // signed-out visitors see the front page first
  const [tab, setTab] = useState("home");              // applicants switch between "home" and "status"

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  const load = useCallback(async () => {
    if (!uid) return;
    const [fac, wk, ap] = await Promise.all([
      supabase.from("facilities").select("id").eq("owner_id", uid).maybeSingle(),
      supabase.from("worker_profiles").select("id, display_name, role, verified").eq("id", uid).maybeSingle(),
      supabase.from("worker_applications").select("id, full_name, status").eq("user_id", uid).maybeSingle(),
    ]);
    if (fac.error || wk.error || ap.error) return setError(true);
    setError(false);
    setMe({ facility: fac.data, worker: wk.data, app: ap.data });
  }, [uid]);

  useEffect(() => {
    setTab("home");
    // Signing out returns to the front page. Signing in keeps the "Apply today" choice made there.
    if (!uid) { setPick(null); setShowSignIn(false); }
    if (uid) { setMe(undefined); load(); } else setMe(undefined);
  }, [uid, load]);

  let screen;
  if (session === undefined) screen = <Loading />;
  else if (!session && !showSignIn) screen = <Landing onSignIn={() => setShowSignIn(true)} onApply={() => { setPick("nurse"); setShowSignIn(true); }} onFacility={() => { setPick("facility"); setShowSignIn(true); }} />;
  else if (!session) screen = <SignIn onBack={() => { setShowSignIn(false); setPick(null); }} />;
  else if (error) screen = <View style={styles.screen}><Text style={styles.p}>Could not load your account. Check your connection and reopen the app.</Text></View>;
  else if (me === undefined) screen = <Loading />;
  else if (me.facility || pick === "facility") screen = <Facility user={session.user} />;
  else if (me.worker) screen = <Worker me={me.worker} />;
  else if (me.app) {
    screen = (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === "home"
            ? <Home app={me.app} onStatus={() => setTab("status")} />
            : <Status app={me.app} onChanged={load} />}
        </View>
        <TabBar tab={tab} onChange={setTab} items={[["home", "Home"], ["status", "Application"]]} />
      </View>
    );
  }
  else if (pick === "nurse") screen = <Apply onDone={load} onBack={() => setPick(null)} />;
  else screen = <Welcome onPick={setPick} />;

  return (
    <>
      <StatusBar style="dark" />
      {screen}
    </>
  );
}

function Loading() {
  return <Apix />;
}

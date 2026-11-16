import { View, Text } from "react-native";
import { supabase } from "./supabase";
import { Button, styles } from "./ui";

export default function Welcome({ onPick }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Welcome to Apixora</Text>
      <Text style={styles.p}>How will you use Apixora?</Text>
      <Button title="I am a facility that needs staff" onPress={() => onPick("facility")} />
      <Button title="I am a nurse or aide looking for shifts" secondary onPress={() => onPick("nurse")} />
      <Button title="Sign out" secondary onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

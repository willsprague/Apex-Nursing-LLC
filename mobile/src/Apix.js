import { useEffect, useRef } from "react";
import { Animated, Easing, View, Text } from "react-native";
import { colors, serif } from "./ui";

// Apix, our dancing bee, built from plain views so it needs no extra libraries.
// Bobs up and down, flaps wings, swings arms and shakes. Reduce-motion users can skip via `still`.
function loop(v, to, ms) {
  return Animated.loop(Animated.sequence([
    Animated.timing(v, { toValue: to, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
  ]));
}
const spin = (v, deg) => v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${deg}deg`] });

export default function Apix({ line = "Getting your shifts ready", still }) {
  const bob = useRef(new Animated.Value(0)).current;
  const wing = useRef(new Animated.Value(0)).current;
  const arm = useRef(new Animated.Value(0)).current;
  const butt = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const a = [loop(bob, 1, 300), loop(wing, 1, 100), loop(arm, 1, 300), loop(butt, 1, 150)];
    a.forEach((x) => x.start());
    return () => a.forEach((x) => x.stop());
  }, [still, bob, wing, arm, butt]);

  const up = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const Wing = ({ side }) => (
    <Animated.View style={{
      position: "absolute", top: 54, [side]: -2, width: 34, height: 52, borderRadius: 20,
      backgroundColor: "#dff0ee", borderWidth: 2, borderColor: "#8fb7b1",
      transform: [{ rotate: spin(wing, side === "left" ? -12 : 12) }],
    }} />
  );
  const Arm = ({ side }) => (
    <Animated.View style={{
      position: "absolute", top: 82, [side]: 4, width: 8, height: 34, borderRadius: 4, backgroundColor: colors.deep,
      transform: [{ translateY: -14 }, { rotate: spin(arm, side === "left" ? 80 : -80) }, { translateY: 14 }],
    }} />
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={{ width: 150, height: 170, alignItems: "center", transform: [{ translateY: up }] }}>
        <Wing side="left" /><Wing side="right" />
        <Animated.View style={{ position: "absolute", top: 58, width: 84, height: 96, borderRadius: 42, backgroundColor: colors.gold, overflow: "hidden", transform: [{ rotate: spin(butt, 12) }] }}>
          {[56, 74].map((t) => <View key={t} style={{ position: "absolute", top: t, left: 0, right: 0, height: 9, backgroundColor: colors.deep }} />)}
        </Animated.View>
        <Arm side="left" /><Arm side="right" />
        <View style={{ position: "absolute", top: 20, width: 62, height: 58, borderRadius: 31, backgroundColor: "#f3c06a" }}>
          <View style={{ position: "absolute", top: 24, left: 15, width: 7, height: 9, borderRadius: 4, backgroundColor: colors.ink }} />
          <View style={{ position: "absolute", top: 24, right: 15, width: 7, height: 9, borderRadius: 4, backgroundColor: colors.ink }} />
          <View style={{ position: "absolute", top: 40, left: 21, width: 20, height: 9, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderTopWidth: 0, borderColor: colors.ink }} />
        </View>
        <View style={{ position: "absolute", top: 8, width: 56, height: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#fff", borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.green, fontWeight: "900", fontSize: 14, lineHeight: 16 }}>+</Text>
        </View>
      </Animated.View>
      <View style={{ width: 70, height: 8, borderRadius: 4, backgroundColor: "rgba(22,40,32,.12)", marginTop: 6 }} />
      <Text style={{ fontFamily: serif, fontSize: 24, fontWeight: "700", color: colors.deep, marginTop: 20 }}>{line}</Text>
      <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>By caregivers, for caregivers</Text>
    </View>
  );
}

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Colors, Radius, Shadows } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const MAX_SECONDS = 30;

type RecordingState = "idle" | "countdown" | "recording" | "preview" | "saving";

const PROMPTS = [
  "What's one thing you're grateful for today?",
  "What do you want your family to know about today?",
  "Share a memory that made you smile this week.",
  "What advice would you give your younger self?",
  "What are you most proud of right now?",
  "Tell your family something they don't know about you.",
  "What's the most important lesson life has taught you?",
  "What does love mean to you?",
];

export default function CheckInScreen() {
  const [permission,   requestPermission] = useCameraPermissions();
  const [facing,       setFacing]         = useState<CameraType>("front");
  const [state,        setState]          = useState<RecordingState>("idle");
  const [countdown,    setCountdown]      = useState(3);
  const [elapsed,      setElapsed]        = useState(0);
  const [prompt,       setPrompt]         = useState(PROMPTS[0]);
  const [videoUri,     setVideoUri]       = useState<string | null>(null);

  const cameraRef  = useRef<CameraView>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pick a random prompt
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Recording pulse animation
  useEffect(() => {
    if (state === "recording") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  async function startCountdown() {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState("countdown");
    let count = 3;
    setCountdown(count);
    const cdTimer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(cdTimer);
        startRecording();
      }
    }, 1000);
  }

  async function startRecording() {
    setState("recording");
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= MAX_SECONDS - 1) {
          stopRecording();
          return MAX_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current?.recordAsync({ maxDuration: MAX_SECONDS });
      if (video?.uri) setVideoUri(video.uri);
    } catch (e) {
      console.warn("Recording error", e);
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    cameraRef.current?.stopRecording();
    setState("preview");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function saveCheckin() {
    setState("saving");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // TODO: Upload to S3, save metadata to DB
    await new Promise((r) => setTimeout(r, 1500));
    router.back();
  }

  function discardAndRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVideoUri(null);
    setElapsed(0);
    setState("idle");
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <LinearGradient colors={["#1A0F0A", "#2D1A0E"]} style={styles.permContainer}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.permContent}>
          <Text style={styles.permEmoji}>🎥</Text>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permDesc}>
            Bhumi needs your camera to record daily check-ins for your family.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
            <LinearGradient colors={["#C4773B", "#D4A017"]} style={styles.permBtnGrad}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  const progressPct = (elapsed / MAX_SECONDS) * 100;

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Dark overlay */}
      <LinearGradient
        colors={["rgba(26,15,10,0.6)", "transparent", "rgba(26,15,10,0.9)"]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.4, 1]}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {state === "recording" && (
          <Animated.View entering={FadeIn} style={styles.recIndicator}>
            <Animated.View style={[styles.recDot, pulseStyle]} />
            <Text style={styles.recText}>{MAX_SECONDS - elapsed}s</Text>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={() => setFacing(facing === "front" ? "back" : "front")}
          style={styles.flipBtn}
        >
          <Text style={styles.flipBtnText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {state === "recording" && (
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, { width: `${progressPct}%` as any }]}
          />
        </View>
      )}

      {/* Countdown overlay */}
      {state === "countdown" && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.countdownOverlay}>
          <Animated.Text
            key={countdown}
            entering={FadeInDown.duration(300)}
            style={styles.countdownText}
          >
            {countdown === 0 ? "GO" : countdown}
          </Animated.Text>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {state === "idle" && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.idleBottom}>
            {/* Prompt card */}
            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>TODAY'S PROMPT</Text>
              <Text style={styles.promptText}>{prompt}</Text>
            </View>

            {/* Record button */}
            <TouchableOpacity onPress={startCountdown} activeOpacity={0.85}>
              <View style={styles.recordBtn}>
                <LinearGradient
                  colors={["#C4773B", "#D4A017"]}
                  style={styles.recordBtnInner}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.recordHint}>Tap to record • Up to 30 seconds</Text>
          </Animated.View>
        )}

        {state === "recording" && (
          <Animated.View entering={FadeIn} style={styles.recordingBottom}>
            <TouchableOpacity onPress={stopRecording} activeOpacity={0.85}>
              <Animated.View style={[styles.stopBtn, pulseStyle]}>
                <View style={styles.stopBtnInner} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.recordHint}>Tap to stop</Text>
          </Animated.View>
        )}

        {state === "preview" && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.previewBottom}>
            <Text style={styles.previewTitle}>Looking good! 🌟</Text>
            <Text style={styles.previewSubtitle}>
              Your family will treasure this moment.
            </Text>
            <View style={styles.previewActions}>
              <TouchableOpacity onPress={discardAndRetry} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Re-record</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCheckin}
                activeOpacity={0.85}
                style={styles.saveWrapper}
              >
                <LinearGradient
                  colors={["#C4773B", "#D4A017"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Save to Legacy ✓</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {state === "saving" && (
          <Animated.View entering={FadeIn} style={styles.savingBottom}>
            <Text style={styles.savingText}>Saving your moment... 🌱</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingTop:     60,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  closeBtnText: {
    color:    "#FAF7F2",
    fontSize: 16,
  },
  recIndicator: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             6,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
  },
  recDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: "#E53E3E",
  },
  recText: {
    color:      "#FAF7F2",
    fontSize:   14,
    fontWeight: "600",
  },
  flipBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  flipBtnText: {
    color:    "#FAF7F2",
    fontSize: 20,
  },
  progressBar: {
    position:        "absolute",
    top:             0,
    left:            0,
    right:           0,
    height:          3,
    backgroundColor: "rgba(255,255,255,0.2)",
    zIndex:          20,
  },
  progressFill: {
    height:          3,
    backgroundColor: "#C4773B",
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         50,
  },
  countdownText: {
    fontSize:   120,
    fontWeight: "900",
    color:      "#FAF7F2",
    opacity:    0.9,
  },
  bottom: {
    position: "absolute",
    bottom:   0,
    left:     0,
    right:    0,
    padding:  32,
    zIndex:   10,
  },
  idleBottom: {
    alignItems: "center",
    gap:        24,
  },
  promptCard: {
    backgroundColor: "rgba(26,15,10,0.85)",
    borderRadius:    Radius.lg,
    padding:         20,
    width:           "100%",
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.3)",
    gap:             8,
  },
  promptLabel: {
    fontSize:      10,
    fontWeight:    "700",
    color:         "#C4773B",
    letterSpacing: 2,
  },
  promptText: {
    fontSize:   16,
    color:      "#FAE8D8",
    lineHeight: 24,
    fontWeight: "400",
  },
  recordBtn: {
    width:           80,
    height:          80,
    borderRadius:    40,
    borderWidth:     3,
    borderColor:     "#FAF7F2",
    alignItems:      "center",
    justifyContent:  "center",
    padding:         4,
  },
  recordBtnInner: {
    width:        "100%",
    height:       "100%",
    borderRadius: 36,
  },
  recordHint: {
    fontSize: 13,
    color:    "rgba(255,255,255,0.5)",
  },
  recordingBottom: {
    alignItems: "center",
    gap:        16,
  },
  stopBtn: {
    width:           80,
    height:          80,
    borderRadius:    40,
    borderWidth:     3,
    borderColor:     "#E53E3E",
    alignItems:      "center",
    justifyContent:  "center",
  },
  stopBtnInner: {
    width:           28,
    height:          28,
    borderRadius:    4,
    backgroundColor: "#E53E3E",
  },
  previewBottom: {
    gap: 16,
  },
  previewTitle: {
    fontSize:   24,
    fontWeight: "700",
    color:      "#FAE8D8",
    textAlign:  "center",
  },
  previewSubtitle: {
    fontSize:  15,
    color:     "#9C8070",
    textAlign: "center",
  },
  previewActions: {
    flexDirection: "row",
    gap:           12,
    marginTop:     8,
  },
  retryBtn: {
    flex:            1,
    paddingVertical: 16,
    alignItems:      "center",
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     "rgba(196,119,59,0.3)",
  },
  retryBtnText: {
    color:      "#9C8070",
    fontSize:   15,
    fontWeight: "600",
  },
  saveWrapper: {
    flex:         2,
    borderRadius: Radius.lg,
    overflow:     "hidden",
  },
  saveBtn: {
    paddingVertical: 16,
    alignItems:      "center",
    borderRadius:    Radius.lg,
  },
  saveBtnText: {
    color:      "#FAF7F2",
    fontSize:   15,
    fontWeight: "700",
  },
  savingBottom: {
    alignItems: "center",
  },
  savingText: {
    fontSize:   18,
    color:      "#C4773B",
    fontWeight: "600",
  },
  permContainer: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
  },
  permContent: {
    paddingHorizontal: 32,
    alignItems:        "center",
    gap:               16,
  },
  permEmoji: {
    fontSize: 64,
  },
  permTitle: {
    fontSize:   24,
    fontWeight: "700",
    color:      "#FAE8D8",
    textAlign:  "center",
  },
  permDesc: {
    fontSize:  16,
    color:     "#9C8070",
    textAlign: "center",
    lineHeight: 24,
  },
  permBtn: {
    width:        "100%",
    borderRadius: Radius.xl,
    overflow:     "hidden",
    marginTop:    8,
  },
  permBtnGrad: {
    paddingVertical: 18,
    alignItems:      "center",
  },
  permBtnText: {
    fontSize:   16,
    fontWeight: "700",
    color:      "#FAF7F2",
  },
});

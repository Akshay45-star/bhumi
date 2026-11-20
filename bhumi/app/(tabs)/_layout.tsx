import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Colors } from "../../constants/theme";

function TabIcon({
  focused,
  emoji,
  label,
}: {
  focused: boolean;
  emoji:   string;
  label:   string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle:  styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🏠" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🎥" label="Vault" />
          ),
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.checkInTab}>
              <Text style={styles.checkInEmoji}>✦</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="💌" label="Messages" />
          ),
        }}
      />
      <Tabs.Screen
        name="legacy"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="🌱" label="Legacy" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="👤" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:        "absolute",
    borderTopWidth:  0,
    backgroundColor: "transparent",
    elevation:       0,
    height:          80,
    paddingBottom:   Platform.OS === "ios" ? 20 : 10,
  },
  tabItem: {
    alignItems:     "center",
    justifyContent: "center",
    gap:            3,
    paddingTop:     8,
    opacity:        0.5,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize:   10,
    color:      "#9C8070",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#C4773B",
  },
  checkInTab: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: "#C4773B",
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    8,
    shadowColor:     "#C4773B",
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    12,
    elevation:       8,
  },
  checkInEmoji: {
    fontSize:  24,
    color:     "#FAF7F2",
    fontWeight: "900",
  },
});

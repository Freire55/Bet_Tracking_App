import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const COLORS = {
  primary: "#4C6EF5",
  accent: "#FF4DF7",
  card: "#FFFFFF",
  textDark: "#0C1536",
};

const menuItems = [
  {
    name: "Sports",
    title: "Sports Management",
    icon: "football-ball",
    iconType: "FontAwesome5",
  },
  {
    name: "Casino",
    title: "Casino Tracker",
    icon: "dice",
    iconType: "FontAwesome5",
  },
  {
    name: "Stats",
    title: "Statistics",
    icon: "stats-chart",
    iconType: "Ionicons",
  },
  {
    name: "History",
    title: "Transaction History",
    icon: "history",
    iconType: "MaterialIcons",
  },
];

const SideBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigation = useNavigation();

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
    setIsVisible(false); // Close the menu after navigation
  };

  const renderIcon = (item, color) => {
    switch (item.iconType) {
      case "Ionicons":
        return <Ionicons name={item.icon} size={28} color={color} />;
      case "MaterialIcons":
        return <MaterialIcons name={item.icon} size={28} color={color} />;
      case "FontAwesome5":
        return <FontAwesome5 name={item.icon} size={24} color={color} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* --- FLOATING ACTION BUTTON (FAB) --- */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="menu-outline" size={32} color={COLORS.card} />
      </TouchableOpacity>

      {/* --- MODAL OVERLAY MENU (THE "SIDEBAR") --- */}
      <Modal
        animationType="fade" // Smooth fade animation
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsVisible(false)} // Close when tapping outside the menu
        >
          <SafeAreaView style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Ionicons
                name="wallet-outline"
                size={30}
                color={COLORS.primary}
              />
              <Text style={styles.menuTitle}>Navigation</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={30} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.menuItem}
                onPress={() => navigateToScreen(item.name)}
              >
                {renderIcon(item, COLORS.primary)}
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // FAB STYLES
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent, // Use the accent color for prominence
    justifyContent: "center",
    alignItems: "center",
    // Shadow for depth
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },

  // MODAL/MENU STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark semi-transparent background
    justifyContent: "flex-start", // Push the menu to the top (or use flex-end for bottom/side)
    alignItems: "flex-end", // Align the menu to the right
  },
  menuContainer: {
    width: "75%", // The width of the "sidebar" panel
    height: "100%", // Full height
    backgroundColor: COLORS.card,
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
    flex: 1,
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    // Slight shadow to make links pop
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: "600",
    marginLeft: 15,
  },
});

export default SideBar;

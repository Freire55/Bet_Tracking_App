import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import PagerView from "react-native-pager-view";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  getAllBets,
  getAllSports,
  getTotalCasinoBalance,
  getTotalSportsBalance,
  insertBet,
  getAllHouses,
  getProfitBySport,
  insertSport,
  insertHouse,
  getSportsStatsAggregated,
} from "../database/database";
import SafeViewAndroid from "./SafeViewAndroid";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#4C6EF5",
  accent: "#FF4DF7",
  background: "#F5F8FD",
  card: "#FFFFFF",
  positive: "#10B981",
  negative: "#EF4444",
  textDark: "#0C1536",
  textGray: "#718096",
  border: "#E2E8F0",
};

// MAIN

const Sports = () => {
  const navigation = useNavigation();

  const goHistory = () => {
    navigation.navigate("History");
  };

  const [sportModalVisible, setSportModalVisible] = useState(false);
  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const [info, setInfo] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [bet, setBet] = useState("");
  const [payout, setPayout] = useState("");
  const [legs, setLegs] = useState(0);
  const [house, setHouse] = useState("");

  const [betHouses, setBetHouses] = useState([]);
  const [sports, setSports] = useState([]);
  const [sportsTotals, setSportsTotals] = useState([]);
  const [sportsRatios, setSportsRatios] = useState([]);
  const [sportsBalance, setSportsBalance] = useState(0);
  const [casinoBalance, setCasinoBalance] = useState(0);

  const [newHouse, setNewHouse] = useState("");
  const [newSport, setNewSport] = useState("");

  const safeSports = Array.isArray(sports) ? sports : [];

  const data = safeSports.map((sport, index) => ({
    key: `${sport.id}`,
    text: sport.sport_name,
    valor: sportsTotals[index + 1] || 0,
    ratios: sportsRatios[index + 1] || [0, 0],
  }));

  data.unshift({
    key: "0",
    text: "TOTAL PROFIT",
    valor: sportsTotals[0] || 0,
    ratios: sportsRatios[0] || [0, 0],
  });

  const options = safeSports.map((sport) => ({
    id: sport.id,
    label: sport.sport_name,
  }));

  const houses = Array.isArray(betHouses)
    ? betHouses.map((house) => ({
        id: house.id,
        label: house.house_name,
      }))
    : [];

  useFocusEffect(
    React.useCallback(() => {
      fetchInfo();
      fetchSportsData();
    }, [])
  );

  const handleSportSelect = (item) => {
    setSelectedSport(item.label);
  };

  const handleHouseSelect = (item) => {
    setSelectedHouse(item.label);
  };

const handleBetChange = (text) => {
  const normalizedText = text.replace(/,/g, '.');

  const regex = /^\d*\.?\d*$/; 

  if (regex.test(normalizedText)) {
    setBet(normalizedText); 
  }
};

const handlePayoutChange = (text) => {
  const normalizedText = text.replace(/,/g, '.');
  const regex = /^\d*\.?\d*$/; 

  if (regex.test(normalizedText)) {
    setPayout(normalizedText); 
  }
};

  const handleLegsChange = (text) => {
    setLegs(parseInt(text) || 0);
  };

  const handleNewHouseChange = (text) => {
    setNewHouse(text || "");
  };

  const handleNewSportChange = (text) => {
    setNewSport(text || "");
  };

  const handleNewSport = async (text) => {
    try {
      await insertSport(text);

      await fetchInfo();
      await fetchSportsData();
      setSportModalVisible(false);
      setNewSport("");
    } catch (error) {
      console.error("Error creating new sport:", error);
    }
  };

  const handleNewHouse = async (text) => {
    try {
      await insertHouse(text);

      await fetchInfo();
      await fetchSportsData();
      setHouseModalVisible(false);
      setNewHouse("");
    } catch (error) {
      console.error("Error creating new house:", error);
    }
  };

  const handleTransaction = async () => {
    if (!selectedSport || !selectedHouse || bet <= 0 || legs <= 0) {
      console.error("Missing required fields (Sport, House, Bet, or Legs).");
      return;
    }

    const sportObj = sports.find((s) => s.sport_name === selectedSport);
    const houseObj = betHouses.find((h) => h.house_name === selectedHouse);

    if (!sportObj || !houseObj) {
      console.error("Sport or House ID not found. Cannot process transaction.");
      return;
    }

    try {
      await insertBet({
        amount_bet: bet,
        amount_won: payout,
        legs: legs,
        sport_id: sportObj.id,
        house_id: houseObj.id,
      });

      setBet(0);
      setPayout(0);
      setLegs(0);
      setSelectedSport(null);
      setSelectedHouse(null);

      await fetchInfo();
      await fetchSportsData();
    } catch (error) {
      console.error("Failed to insert bet:", error);
    }
  };

  const handleNoInfo = () => {
    setInfo(true);
  };

  const fetchInfo = async () => {
    try {
      const sportsArray = await getAllSports();
      const housesArray = await getAllHouses();
      const sportsBalanceValue = await getTotalSportsBalance();

      setSports(sportsArray || []);
      setBetHouses(housesArray || []);
      setSportsBalance(sportsBalanceValue);
    } catch (error) {
      console.error("DB ERROR: Error fetching Info data:", error);
    }
  };

  const fetchSportsData = async () => {
    try {
      const sportsArray = (await getAllSports()) || [];
      setSports(sportsArray);

      const aggregatedStats = (await getSportsStatsAggregated()) || [];

      let grandTotalProfit = 0;
      let grandTotalWins = 0;
      let grandTotalLosses = 0;

      const totals = [];
      const ratios = [];

      for (let sport of sportsArray) {
        const stat = aggregatedStats.find(s => s.id === sport.id) || {};
        const profit = stat.total_profit || 0;
        const wins = stat.wins || 0;
        const losses = stat.losses || 0;

        totals.push(profit);
        ratios.push([wins, losses]);

        grandTotalProfit += profit;
        grandTotalWins += wins;
        grandTotalLosses += losses;
      }

      setSportsTotals([grandTotalProfit, ...totals]);
      setSportsRatios([[grandTotalWins, grandTotalLosses], ...ratios]);
    } catch (error) {
      console.error("DB FATAL CRASH: Error fetching Sports Data:", error);
    }
  };

  const renderModal = (
    isVisible,
    onClose,
    title,
    placeholder,
    value,
    onChange,
    onSave
  ) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            onChangeText={onChange}
            value={value}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={{ color: COLORS.primary }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSave(value)}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSidebarItem = (page) => {
    const isTotal = page.key === "0";
    const profitColorStyle =
      page.valor >= 0 ? styles.positiveColor : styles.negativeColor;
    const icon = isTotal ? "chart-line" : "dumbbell";

    return (
      <View style={styles.pagerViewPage} key={page.key}>
        <View style={[styles.sidebarItem, isTotal && styles.totalItem]}>
          <FontAwesome5
            name={icon}
            size={20}
            color={isTotal ? "#FFFFFF" : COLORS.primary}
          />
          <Text style={[styles.sidebarText, isTotal && { color: "#FFF" }]}>
            {page.text}
          </Text>
          <Text style={[styles.ratiosText, isTotal && { color: "#E0E0E0" }]}>
            {Array.isArray(page.ratios)
              ? `W-L: ${page.ratios[0]} / ${page.ratios[1]}`
              : "W-L: N/A"}
          </Text>
          <Text style={[styles.balanceText, profitColorStyle]}>
            {typeof page.valor === "number"
              ? page.valor.toFixed(2)
              : page.valor}
            €
          </Text>
        </View>
      </View>
    );
  };

  const renderSelectionCard = useCallback((
    title,
    items,
    selectedItem,
    onSelect,
    onAddPress
  ) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectionScroll}
      >
        {items.length > 0 ? (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.selectionPill,
                selectedItem === item.label && styles.selectedPill,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text
                style={[
                  styles.selectionText,
                  selectedItem === item.label && styles.selectedText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Please add a {title.split(" ")[1]} first!
          </Text>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.selectionPillAdd} onPress={onAddPress}>
        <Ionicons name="add" size={20} color={COLORS.primary} />
        <Text style={[styles.selectionText, { marginLeft: 5 }]}>Add New</Text>
      </TouchableOpacity>
    </View>
  ), []);

  return (
    <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Bet Tracker</Text>
      </View>

      <View style={styles.pagerContainer}>
        <PagerView style={styles.pagerView} initialPage={0}>
          {data.map(renderSidebarItem)}
        </PagerView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust if needed
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {renderSelectionCard(
            "Select Sport",
            options,
            selectedSport,
            handleSportSelect,
            () => setSportModalVisible(true)
          )}

          {renderSelectionCard(
            "Select House",
            houses,
            selectedHouse,
            handleHouseSelect,
            () => setHouseModalVisible(true)
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            <View style={styles.inputArea}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Bet Amount (€)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="0.00"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="decimal-pad"
                  onChangeText={handleBetChange}
                  value={bet >= 0 ? String(bet) : ""}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Payout (€)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder={"0.00"}
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                  onChangeText={handlePayoutChange}
                  value={payout >= 0 ? String(payout) : ""}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Number of Legs</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder="Legs"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                onChangeText={handleLegsChange}
                value={legs > 0 ? String(legs) : ""}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={
              bet >= 0 && selectedSport && selectedHouse && legs > 0
                ? handleTransaction
                : handleNoInfo
            }
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>🤑 Record Bet 🤑</Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {renderModal(
        sportModalVisible,
        () => setSportModalVisible(false),
        "Add New Sport",
        "e.g., Football, Basketball",
        newSport,
        handleNewSportChange,
        handleNewSport
      )}

      {renderModal(
        houseModalVisible,
        () => setHouseModalVisible(false),
        "Add New Bet House",
        "e.g., Bet365, FanDuel",
        newHouse,
        handleNewHouseChange,
        handleNewHouse
      )}
    </SafeAreaView>
  );
};

export default Sports;

const styles = StyleSheet.create({
  // LAYOUT
  screen: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
  },
  historyButtonText: {
    marginLeft: 5,
    color: COLORS.textDark,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  pagerContainer: {
    height: width * 0.45,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  pagerView: {
    flex: 1,
    width: "100%",
  },
  pagerViewPage: {
    padding: 10,
  },
  sidebarItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 15,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  totalItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  sidebarText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  ratiosText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  positiveColor: { color: COLORS.positive },
  negativeColor: { color: COLORS.negative },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: {
    color: COLORS.textDark,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyText: {
    color: COLORS.textGray,
    fontStyle: "italic",
  },

  selectionScroll: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 5,
  },
  selectionPill: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectionPillAdd: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  selectedPill: {
    backgroundColor: COLORS.primary,
  },
  selectionText: {
    color: COLORS.textDark,
    fontWeight: "500",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  inputArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 5,
  },
  inputField: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    padding: 18,
    alignItems: "center",
    marginTop: 25,

    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

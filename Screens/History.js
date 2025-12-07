import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Platform, // Added Platform for potential OS specific styling
} from "react-native";
import React, { useEffect, useState } from "react";
import SafeViewAndroid from "./SafeViewAndroid";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { 
    getAllBets, 
    getAllCasinoBets, 
    getTotalCasinoRisked, 
    getTotalSportsRisked,
    getAllHouses, 
    getAllSports,
    getAllGames,
    // Add getAllGames when casino bets are fully implemented
} from "../database/database";

// --- CONSTANTS ---
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

const HistoryToggle = ({ activeTab, setActiveTab }) => (
    <View style={toggleStyles.container}>
        <TouchableOpacity
            style={[
                toggleStyles.button,
                activeTab === 'sports' && toggleStyles.activeButton
            ]}
            onPress={() => setActiveTab('sports')}
        >
            <Text style={[
                toggleStyles.text,
                activeTab === 'sports' && toggleStyles.activeText
            ]}>
                🏀 Sports
            </Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[
                toggleStyles.button,
                activeTab === 'casino' && toggleStyles.activeButton
            ]}
            onPress={() => setActiveTab('casino')}
        >
            <Text style={[
                toggleStyles.text,
                activeTab === 'casino' && toggleStyles.activeText
            ]}>
                🎰 Casino
            </Text>
        </TouchableOpacity>
    </View>
);

const History = () => {
  const navigation = useNavigation();

  // New state to manage the view choice
  const [activeTab, setActiveTab] = useState('sports'); 

  const [betsHistory, setBetsHistory] = useState([]);
  const [CasinoBetsHistory, setCasinoBetsHistory] = useState([]);
  const [sportsRisked, setSportsRisked] = useState(0);
  const [casinoRisked, setCasinoRisked] = useState(0);

  const [sportMap, setSportMap] = useState({}); 
  const [houseMap, setHouseMap] = useState({});
  const [gameMap, setGameMap] = useState({}); // Needed for Casino view

  const retrieveHistory = async () => {
    try {
        // Fetch all necessary data concurrently
        const [betsArray, casinoBetsArray, houses, sports, games, totalSportsRisked, totalCasinoRisked] = await Promise.all([
            getAllBets(),
            getAllCasinoBets(),
            getAllHouses(),
            getAllSports(),
            getAllGames(),
            getTotalSportsRisked(),
            getTotalCasinoRisked(),
            // You may want to fetch getAllGames() here too
        ]);

        // Create lookup maps
        const sportLookup = sports.reduce((acc, s) => ({ ...acc, [s.id]: s.sport_name }), {});
        const houseLookup = houses.reduce((acc, h) => ({ ...acc, [h.id]: h.house_name }), {});
        const gameLookup = games.reduce((acc, s) => ({...acc, [s.id] : s.game_name}), {})

        // Set state for data and lookups
        setBetsHistory(betsArray.reverse()); // Reverse immediately for chronological view
        setCasinoBetsHistory(casinoBetsArray.reverse());
        setSportsRisked(totalSportsRisked);
        setCasinoRisked(totalCasinoRisked);
        setSportMap(sportLookup);
        setHouseMap(houseLookup);
        setGameMap(gameLookup);
    } catch (error) {
        console.error("Failed to retrieve history data:", error);
    }
  }

  useEffect(() => {
    retrieveHistory();
  }, []);

  const renderBetCard = (transaction, type) => {
    const isSports = type === 'sports';
    
    // Determine which fields to pull based on type
    const amount_bet = transaction.amount_bet;
    const amount_won = transaction.amount_won;
    const house_id = transaction.house_id;
    const betted_at = transaction.betted_at;
    
    // Sports specific
    const legs = isSports ? transaction.legs : null;
    const sport_id = isSports ? transaction.sport_id : null;
    
    // Casino specific
    const game_id = !isSports ? transaction.game_id : null;

    const profit_loss = amount_won - amount_bet;
    const amountColor = profit_loss >= 0 ? COLORS.positive : COLORS.negative;
    const profitText = `${profit_loss >= 0 ? '+' : ''}${profit_loss.toFixed(2)}€`;
    
    // --- Use lookup maps for names ---
    const primaryName = isSports 
        ? (sportMap[sport_id] || 'Unknown Sport')
        : (gameMap[game_id] || 'Unknown Game'); // Needs gameMap implementation
    const houseName = houseMap[house_id] || 'Unknown House';
    
    // --- Format the date ---
    const formattedDate = new Date(betted_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
    
    // Icon Logic
    const IconComponent = isSports ? FontAwesome5 : MaterialIcons;
    const iconName = isSports ? "futbol" : "casino"; // Simple icon choice

    return (
      <TouchableOpacity
        key={transaction.id} // Use unique ID as key
        style={styles.card}
      >
        {/* LEFT SECTION: Icon and House Name */}
        <View style={styles.iconContainer}>
            <IconComponent name={iconName} size={24} color={COLORS.primary} />
            <Text style={styles.houseNameText}>{houseName}</Text>
        </View>

        {/* MIDDLE SECTION: Amounts and Legs/Game */}
        <View style={styles.detailsContainer}>
            <Text style={styles.betSummaryText}>
                {amount_bet.toFixed(2)}€ {'->'} {amount_won.toFixed(2)}€
            </Text>
            
            <View style={styles.detailsRow}>
                {isSports ? (
                    <Text style={styles.legsText}>
                        {legs} leg-parlay
                    </Text>
                ) : (
                    <Text style={styles.legsText}>
                        Casino Wager
                    </Text>
                )}
                <Text style={[styles.profitText, { color: amountColor }]}>
                    {profitText}
                </Text>
            </View>
        </View>

        {/* RIGHT SECTION: Sport/Game Name and Date */}
        <View style={styles.sportNameContainer}>
            <Text style={styles.sportNameText}>{primaryName}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Determine which list to display
  const currentHistory = activeTab === 'sports' ? betsHistory : CasinoBetsHistory;
  const totalRisked = activeTab === 'sports' ? sportsRisked : casinoRisked;

  return (
    <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
        
      {/* TOTALS HEADER */}
      <View style={styles.totalsHeader}>
          <Text style={styles.totalRiskedTitle}>
            TOTAL {activeTab.toUpperCase()} RISKED:
          </Text>
          <Text style={styles.totalRiskedAmount}>
            {totalRisked.toFixed(2)}€
          </Text>
      </View>
      
      {/* TOGGLE BUTTONS */}
      <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
          <HistoryToggle activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>
      
      {/* HISTORY LIST */}
      <ScrollView style={styles.scrollView} alwaysBounceVertical>
          {currentHistory.length > 0 ? (
              currentHistory.map((item, index) => renderBetCard(item, activeTab))
          ) : (
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No {activeTab} history found.</Text>
                  <Text style={styles.emptyTextSmall}>Time to place a bet!</Text>
              </View>
          )}
          <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;

// --- TOGGLE STYLES ---
const toggleStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.border,
        borderRadius: 10,
        overflow: 'hidden',
        height: 40,
    },
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    activeButton: {
        backgroundColor: COLORS.primary,
        ...Platform.select({
            ios: {
                borderRadius: 9, // Slightly smaller on iOS for nested look
            },
        }),
    },
    text: {
        color: COLORS.textDark,
        fontSize: 15,
        fontWeight: '600',
    },
    activeText: {
        color: COLORS.card, // White text for active button
    },
});


// --- HISTORY STYLES ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  
  // --- HEADER TOTALS ---
  totalsHeader: {
    padding: 15,
    backgroundColor: COLORS.card, 
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  totalRiskedTitle: {
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: '500',
  },
  totalRiskedAmount: {
    color: COLORS.textDark,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  // --- CARD STYLING ---
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 85,
    padding: 15,
    marginVertical: 6,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  
  // --- CARD SECTIONS ---
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  houseNameText: {
      color: COLORS.textGray,
      fontSize: 10,
      marginTop: 2,
      textAlign: 'center',
  },
  
  detailsContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  betSummaryText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'space-between',
    width: '95%',
  },
  legsText: {
    color: COLORS.textGray,
    fontSize: 12,
  },
  profitText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  sportNameContainer: {
    width: 90, 
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  sportNameText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: { 
    color: COLORS.textGray,
    fontSize: 11,
    fontWeight: '500',
  },
  
  // --- EMPTY STATE ---
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textGray,
    marginBottom: 5,
  },
  emptyTextSmall: {
    fontSize: 14,
    color: COLORS.textGray,
  }
});
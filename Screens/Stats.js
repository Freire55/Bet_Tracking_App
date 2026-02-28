import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator, 
} from "react-native";
import React, { useState, useEffect } from "react"; 
import { useFocusEffect } from "@react-navigation/native";
import SafeViewAndroid from "./SafeViewAndroid";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"; 

// ALL DATABASE FUNCTIONS
import {
   getAllBets, getAllCasinoBets, getAllHouses, getAllSports,
   getCasinoProfitByHouse, getProfitByGame, getProfitBySport, getSportProfitByHouse,
   getTotalCasinoBalance, getTotalCasinoRisked, getTotalSportsBalance, getTotalSportsRisked,
   getAllGames, 
   getProfitBySportAndHouse, 
   getProfitByGameAndHouse, 
} from "../database/database"; 


// --- CONSTANTS (Light Theme) ---
const COLORS = {
  primary: "#4C6EF5", 
  secondary: "#17CAE6", 
  background: "#FFFFFF", // White background
  card: "#F8F9FA", // Light gray/off-white card background
  positive: "#10B981", // Green (Profit)
  negative: "#EF4444", // Red (Loss)
  textDark: "#212529", // Dark Text for readability
  textGray: "#6C757D", // Medium Gray for secondary text
  border: "#DEE2E6", // Light border
};

// --- INITIAL STATE (ZERO-FILLED) ---
const INITIAL_STATE = {
  SPORTS: {
    totalPL: 0, totalRisked: 0, winRate: "0.00%", bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    singleBreakdown: [], combinedBreakdown: [],
  },
  CASINO: {
    totalPL: 0, totalRisked: 0, winRate: "0.00%", bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    singleBreakdown: [], combinedBreakdown: [],
  },
};

// --- Sub-Components ---

const StatsToggle = ({ activeTab, setActiveTab }) => (
    <View style={toggleStyles.container}>
        <TouchableOpacity
        style={[
            toggleStyles.button,
            activeTab === "sports" && toggleStyles.activeButton,
        ]}
        onPress={() => setActiveTab("sports")}
        >
        <Text
            style={[
            toggleStyles.text,
            activeTab === "sports" && toggleStyles.activeText,
            ]}
        >
            🏀 Sports
        </Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={[
            toggleStyles.button,
            activeTab === "casino" && toggleStyles.activeButton,
        ]}
        onPress={() => setActiveTab("casino")}
        >
        <Text
            style={[
            toggleStyles.text,
            activeTab === "casino" && toggleStyles.activeText,
            ]}
        >
            🎰 Casino
        </Text>
        </TouchableOpacity>
    </View>
);

const SummaryCard = ({ title, value, color, iconName }) => {
    return (
        <View style={summaryStyles.card}>
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={summaryStyles.title}>{title}</Text>
            <Text style={[summaryStyles.value, { color }]}>{value}</Text>
        </View>
    );
};

const SingleBreakdownList = ({ data, title }) => {
    const sortedData = [...data].sort((a, b) => b.profit - a.profit);

    const renderItem = (item) => {
        const profitColor = item.profit >= 0 ? COLORS.positive : COLORS.negative;
        const profitSign = item.profit >= 0 ? "+" : "";

        return (
        <View key={item.id} style={breakdownStyles.itemRow}>
            <View style={breakdownStyles.itemLeft}>
            <Text style={[breakdownStyles.itemName, { flex: 1 }]}>
                {item.name} 
            </Text>
            </View>
            <Text style={[breakdownStyles.itemProfit, { color: profitColor }]}>
            {profitSign}
            {item.profit.toFixed(2)}€
            </Text>
        </View>
        );
    };
    
    const content = sortedData.length > 0 ? (
        sortedData.map(renderItem)
    ) : (
        <Text style={breakdownStyles.noData}>No data to display.</Text>
    );

    return (
        <View style={[styles.breakdownCard, { marginBottom: 10 }]}> 
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={breakdownStyles.container}>
            {content}
        </View>
        </View>
    );
};

const CombinedBreakdownList = ({ data, activeTab }) => {
    const isSports = activeTab === "sports";
    const primaryKey = isSports ? "sport" : "game";
    const primaryLabel = isSports ? "Sport" : "Game";

    const sortedData = [...data].sort((a, b) => b.profit - a.profit);

    const renderItem = (item) => {
        const profitColor = item.profit >= 0 ? COLORS.positive : COLORS.negative;
        const profitSign = item.profit >= 0 ? "+" : "";

        if (item.profit == 0) {
            return;
        }

        return (
        <View key={item.id} style={breakdownStyles.itemRow}>
            <View style={breakdownStyles.itemLeft}> 
            
            <Text style={breakdownStyles.itemName}>
                {item[primaryKey]} 
            </Text>

            <MaterialCommunityIcons
                name="link-variant"
                size={14}
                color={COLORS.textGray}
                style={{ marginHorizontal: 5 }}
            />

            <Text
                style={[
                breakdownStyles.itemName,
                { 
                    color: COLORS.textGray, 
                    flexShrink: 1, 
                }, 
                ]}
            >
                {item.house}
            </Text>
            </View>

            <Text style={[breakdownStyles.itemProfit, { color: profitColor }]}>
            {profitSign}
            {item.profit.toFixed(2)}€
            </Text>
        </View>
        );
    };
    
    const content = sortedData.length > 0 ? (
        sortedData.map(renderItem)
    ) : (
        <Text style={breakdownStyles.noData}>No data to display.</Text>
    );

    return (
        <View style={styles.breakdownCard}> 
        <Text style={styles.cardTitle}>
            {primaryLabel} & House Profit Combinations
        </Text>

        <View style={breakdownStyles.container}>
            {content}
        </View>
        </View>
    );
};


// --- MAIN COMPONENT ---
const Stats = () => {
    const [activeTab, setActiveTab] = useState("sports");
    const [statsData, setStatsData] = useState(INITIAL_STATE); 
    const [loading, setLoading] = useState(true); 

    // --- REAL DATA FETCHING AND PROCESSING LOGIC ---
    const fetchData = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500)); 

        try {
            // --- 1. Fetching Raw Data ---
            const betsArray = (await getAllBets()) || [];
            const casinoBetsArray = (await getAllCasinoBets()) || [];
            const housesArray = (await getAllHouses()) || [];
            const sportsArray = (await getAllSports()) || [];
            const gamesArray = (await getAllGames()) || []; 
            
            // --- 2. Calculate Totals and Win Rates ---
            const sportBalance = await getTotalSportsBalance() || 0;
            const casinoBalance = await getTotalCasinoBalance() || 0;
            const sportRisked = await getTotalSportsRisked() || 0;
            const casinoRisked = await getTotalCasinoRisked() || 0;
            
            const sportsWins = betsArray.filter(b => (b.amount_won - b.amount_bet) > 0).length;
            const casinoWins = casinoBetsArray.filter(b => (b.amount_won - b.amount_bet) > 0).length;
            const sportsTotal = betsArray.length;
            const casinoTotal = casinoBetsArray.length;
            
            const sportsWinRate = sportsTotal > 0 ? ((sportsWins / sportsTotal) * 100).toFixed(2) + '%' : '0.00%';
            const casinoWinRate = casinoTotal > 0 ? ((casinoWins / casinoTotal) * 100).toFixed(2) + '%' : '0.00%';

            // --- 3. Build Breakdown Lists (Single and Combined) ---
            
            let sportsSingleBreakdown = [];
            let casinoSingleBreakdown = [];
            let sportsCombinedBreakdown = [];
            let casinoCombinedBreakdown = [];
            let idCounter = 1;

            // Single Breakdowns (Sport/Game and House)
            for (let sport of sportsArray) {
                const profit = await getProfitBySport(sport.id);
                sportsSingleBreakdown.push({ id: sport.id, name: sport.sport_name || sport.name, type: 'Sport', profit: profit || 0 }); 
            }
            for (let game of gamesArray) {
                const profit = await getProfitByGame(game.id);
                casinoSingleBreakdown.push({ id: game.id, name: game.game_name || game.name, type: 'Game', profit: profit || 0 }); 
            }
            for (let house of housesArray) {
                const sportProfit = await getSportProfitByHouse(house.id);
                const casinoProfit = await getCasinoProfitByHouse(house.id);
                
                const houseName = house.house_name || house.name;

                if (sportProfit !== undefined && sportProfit !== null) {
                    sportsSingleBreakdown.push({ id: house.id + 'H', name: houseName, type: 'House', profit: sportProfit }); 
                }
                if (casinoProfit !== undefined && casinoProfit !== null) {
                    casinoSingleBreakdown.push({ id: house.id + 'H', name: houseName, type: 'House', profit: casinoProfit }); 
                }
            }

            // Combined Breakdowns
            for (let sport of sportsArray) {
                for (let house of housesArray) {
                    const profit = await getProfitBySportAndHouse(sport.id, house.id);
                    if (profit !== null) {
                        sportsCombinedBreakdown.push({ id: idCounter++, sport: sport.sport_name || sport.name, house: house.house_name || house.name, profit: profit || 0 });
                    }
                }
            }
            for (let game of gamesArray) {
                for (let house of housesArray) {
                    const profit = await getProfitByGameAndHouse(game.id, house.id);
                    if (profit !== null) {
                        casinoCombinedBreakdown.push({ id: idCounter++, game: game.game_name || game.name, house: house.house_name || house.name, profit: profit || 0 });
                    }
                }
            }
            
            // --- 4. Construct Final Data Object ---
            const newStats = {
                SPORTS: {
                    totalPL: sportBalance,
                    totalRisked: sportRisked,
                    winRate: sportsWinRate,
                    bets: sportsTotal,
                    stats: { wins: sportsWins, losses: sportsTotal - sportsWins, pushes: 0, total: sportsTotal },
                    singleBreakdown: sportsSingleBreakdown, 
                    combinedBreakdown: sportsCombinedBreakdown, 
                },
                CASINO: {
                    totalPL: casinoBalance,
                    totalRisked: casinoRisked,
                    winRate: casinoWinRate,
                    bets: casinoTotal,
                    stats: { wins: casinoWins, losses: casinoTotal - casinoWins, pushes: 0, total: casinoTotal },
                    singleBreakdown: casinoSingleBreakdown, 
                    combinedBreakdown: casinoCombinedBreakdown,
                },
            };
            
            setStatsData(newStats); 
            
        } catch (error) {
            console.error("Error fetching stats data:", error);
            setStatsData(INITIAL_STATE);
        } finally {
            setLoading(false);
        }
    };

    // Run the data fetch whenever the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    // --- UI Logic uses the state data ---
    const currentData = statsData[activeTab.toUpperCase()];
    const isSports = activeTab === "sports";

    const profitColor =
        currentData.totalPL >= 0 ? COLORS.positive : COLORS.negative;

    // Filter single breakdown data for the two initial sections
    const singleSportGameData = currentData.singleBreakdown.filter(
        (item) => item.type === (isSports ? "Sport" : "Game")
    );
    const singleHouseData = currentData.singleBreakdown.filter(
        (item) => item.type === "House"
    );


    if (loading) {
        return (
            <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textDark, marginTop: 10 }}>Loading statistics...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
        <ScrollView style={styles.scrollView}>
            {/* --- TOGGLE BUTTONS (SPORT/CASINO) --- */}
            <View style={{ marginHorizontal: 15, marginBottom: 15 }}>
                <StatsToggle activeTab={activeTab} setActiveTab={setActiveTab} />
            </View>

            {/* --- SUMMARY STATS --- */}
            <View style={summaryStyles.container}>
            <SummaryCard
                title="Total P/L"
                value={`${currentData.totalPL.toFixed(2)}€`}
                color={profitColor}
                iconName="stats-chart"
            />
            <SummaryCard
                title="Win Rate"
                value={currentData.winRate}
                color={COLORS.secondary}
                iconName="trophy"
            />
            <SummaryCard
                title="Total Bets"
                value={currentData.stats.total.toString()}
                color={COLORS.textDark}
                iconName="calculator"
            />
            </View>

            {/* --- 1. SINGLE BREAKDOWN (SPORT/GAME) --- */}
            <SingleBreakdownList
            data={singleSportGameData}
            title={isSports ? "Profit by Sport" : "Profit by Game"}
            />

            {/* --- 2. SINGLE BREAKDOWN (HOUSE) --- */}
            <SingleBreakdownList data={singleHouseData} title="Profit by House" />

            {/* --- 3. COMBINED BREAKDOWN (SPORT/GAME + HOUSE) --- */}
            <CombinedBreakdownList
            data={currentData.combinedBreakdown}
            activeTab={activeTab}
            />

            <View style={{ height: 50 }} />
        </ScrollView>
        </SafeAreaView>
    );
};

export default Stats;

// --- STYLES ---

const toggleStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        backgroundColor: COLORS.border, 
        borderRadius: 10,
        overflow: "hidden",
        height: 40,
    },
    button: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 15,
    },
    activeButton: {
        backgroundColor: COLORS.secondary, 
    },
    text: {
        color: COLORS.textDark, 
        fontSize: 15,
        fontWeight: "600",
    },
    activeText: {
        color: COLORS.background, 
    },
});

const summaryStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        backgroundColor: COLORS.card, 
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        color: COLORS.textGray, 
        fontSize: 12,
        marginTop: 5,
    },
    value: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 2,
    },
});

const breakdownStyles = StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, 
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        flexWrap: 'wrap', 
    },
    itemType: {
        fontSize: 12,
        marginRight: 4,
        fontWeight: "300",
    },
    itemName: {
        fontSize: 15,
        color: COLORS.textDark, 
        fontWeight: "500",
        marginRight: 5,
    },
    itemProfit: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
        minWidth: 70,
        textAlign: "right",
    },
    noData: {
        color: COLORS.textGray,
        textAlign: "center",
        paddingVertical: 20,
    },
});

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background, 
    },
    scrollView: {
        flex: 1,
    },
    breakdownCard: {
        marginVertical: 10,
        padding: 5,
        backgroundColor: COLORS.card, 
        marginHorizontal: 15,
        borderRadius: 15,
        borderWidth: 1, 
        borderColor: COLORS.border, 
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textDark, 
        alignSelf: "flex-start",
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 5,
    },
});
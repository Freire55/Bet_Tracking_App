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
// ADDED useMemo for chart data optimization
import React, { useState, useEffect, useMemo } from "react"; 
import SafeViewAndroid from "./SafeViewAndroid";
// CORRECTED IMPORT
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";

// Import the new aggregation helper (ASSUMING PATH IS CORRECT)
import { calculateProfitChartData } from "../utils/statsAggregator"; 

// ALL DATABASE FUNCTIONS
import {
   getAllBets, getAllCasinoBets, getAllHouses, getAllSports,
   getCasinoProfitByHouse, getProfitByGame, getProfitBySport, getSportProfitByHouse,
   getTotalCasinoBalance, getTotalCasinoRisked, getTotalSportsBalance, getTotalSportsRisked,
   getAllGames, 
   getProfitBySportAndHouse, 
   getProfitByGameAndHouse, 
} from "./database"; 


// --- CONSTANTS ---
const { width: screenWidth } = Dimensions.get("window");
const CHART_PERIODS = [
    { key: '7d', label: '7 Days' },
    { key: '4w', label: '4 Weeks' },
    { key: '6m', label: '6 Months' },
    { key: '4y', label: '4 Years' },
];
const COLORS = {
  primary: "#4C6EF5", 
  secondary: "#17CAE6", 
  background: "#071A2F", 
  card: "#122A46", 
  positive: "#10B981", 
  negative: "#EF4444", 
  textLight: "#FFFFFF",
  textGray: "#A9B4C4",
  border: "#2C405A",
};

// --- INITIAL STATE (ZERO-FILLED) ---
const INITIAL_CHART_DATA = {
    '7d': { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] },
    '4w': { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ data: [0, 0, 0, 0] }] },
    '6m': { labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'], datasets: [{ data: [0, 0, 0, 0, 0, 0] }] },
    '4y': { labels: ['Y1', 'Y2', 'Y3', 'Y4'], datasets: [{ data: [0, 0, 0, 0] }] },
};

const INITIAL_STATE = {
  SPORTS: {
    totalPL: 0, totalRisked: 0, winRate: "0.00%", bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    charts: INITIAL_CHART_DATA, 
    singleBreakdown: [], combinedBreakdown: [],
  },
  CASINO: {
    totalPL: 0, totalRisked: 0, winRate: "0.00%", bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    charts: INITIAL_CHART_DATA, 
    singleBreakdown: [], combinedBreakdown: [],
  },
};

// --- Sub-Components (RESTORED DEFINITIONS) ---

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
        <View style={[styles.chartContainer, { marginBottom: 10 }]}>
        <Text style={styles.chartTitle}>{title}</Text>
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

        return (
        <View key={item.id} style={breakdownStyles.itemRow}>
            <View style={breakdownStyles.itemLeft}>
            <Text style={[breakdownStyles.itemName, { maxWidth: "35%" }]}>
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
                { color: COLORS.textGray, maxWidth: "35%" },
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
        <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
            {primaryLabel} & House Profit Combinations
        </Text>

        <View style={breakdownStyles.container}>
            {content}
        </View>
        </View>
    );
};

const ChartPeriodToggle = ({ activePeriod, setActivePeriod }) => (
    <View style={chartToggleStyles.container}>
        {CHART_PERIODS.map(period => (
            <TouchableOpacity
                key={period.key}
                style={[
                    chartToggleStyles.button,
                    activePeriod === period.key && chartToggleStyles.activeButton,
                ]}
                onPress={() => setActivePeriod(period.key)}
            >
                <Text style={[
                    chartToggleStyles.text,
                    activePeriod === period.key && chartToggleStyles.activeText,
                ]}>
                    {period.label}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);


// --- MAIN COMPONENT ---
const Stats = () => {
    const [activeTab, setActiveTab] = useState("sports");
    const [chartPeriod, setChartPeriod] = useState('7d'); 
    const [statsData, setStatsData] = useState(INITIAL_STATE); 
    const [loading, setLoading] = useState(true); 

    // Memoize the chart data to prevent unnecessary recalculations
    const currentChartData = useMemo(() => {
        return statsData[activeTab.toUpperCase()].charts[chartPeriod] || INITIAL_STATE.SPORTS.charts[chartPeriod];
    }, [statsData, activeTab, chartPeriod]);

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

            // --- 3. Calculate CHART DATA for all periods ---
            const sportCharts = {};
            const casinoCharts = {};
            
            for (const period of CHART_PERIODS) {
                // Ensure calculateProfitChartData is correctly imported and available
                sportCharts[period.key] = calculateProfitChartData(betsArray, period.key);
                casinoCharts[period.key] = calculateProfitChartData(casinoBetsArray, period.key);
            }
            
            // --- 4. Build Breakdown Lists (Single and Combined) ---
            
            let sportsSingleBreakdown = [];
            let casinoSingleBreakdown = [];
            let sportsCombinedBreakdown = [];
            let casinoCombinedBreakdown = [];
            let idCounter = 1;

            // Single Breakdowns (Sport/Game and House)
            for (let sport of sportsArray) {
                const profit = await getProfitBySport(sport.id);
                sportsSingleBreakdown.push({ id: sport.id, name: sport.sport_name, type: 'Sport', profit: profit || 0 }); 
            }
            for (let game of gamesArray) {
                const profit = await getProfitByGame(game.id);
                casinoSingleBreakdown.push({ id: game.id, name: game.game_name, type: 'Game', profit: profit || 0 }); 
            }
            for (let house of housesArray) {
                const sportProfit = await getSportProfitByHouse(house.id);
                const casinoProfit = await getCasinoProfitByHouse(house.id);
                
                if (sportProfit !== undefined && sportProfit !== null) {
                    sportsSingleBreakdown.push({ id: house.id + 'H', name: house.house_name, type: 'House', profit: sportProfit }); 
                }
                if (casinoProfit !== undefined && casinoProfit !== null) {
                    casinoSingleBreakdown.push({ id: house.id + 'H', name: house.house_name, type: 'House', profit: casinoProfit }); 
                }
            }

            // Combined Breakdowns
            for (let sport of sportsArray) {
                for (let house of housesArray) {
                    const profit = await getProfitBySportAndHouse(sport.id, house.id);
                    if (profit !== null) {
                        sportsCombinedBreakdown.push({ id: idCounter++, sport: sport.sport_name, house: house.house_name, profit: profit || 0 });
                    }
                }
            }
            for (let game of gamesArray) {
                for (let house of housesArray) {
                    const profit = await getProfitByGameAndHouse(game.id, house.id);
                    if (profit !== null) {
                        casinoCombinedBreakdown.push({ id: idCounter++, game: game.game_name, house: house.house_name, profit: profit || 0 });
                    }
                }
            }
            
            // --- 5. Construct Final Data Object ---
            const newStats = {
                SPORTS: {
                    totalPL: sportBalance,
                    totalRisked: sportRisked,
                    winRate: sportsWinRate,
                    bets: sportsTotal,
                    stats: { wins: sportsWins, losses: sportsTotal - sportsWins, pushes: 0, total: sportsTotal },
                    charts: sportCharts, 
                    singleBreakdown: sportsSingleBreakdown, 
                    combinedBreakdown: sportsCombinedBreakdown, 
                },
                CASINO: {
                    totalPL: casinoBalance,
                    totalRisked: casinoRisked,
                    winRate: casinoWinRate,
                    bets: casinoTotal,
                    stats: { wins: casinoWins, losses: casinoTotal - casinoWins, pushes: 0, total: casinoTotal },
                    charts: casinoCharts, 
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

    // Run the data fetch only on mount
    useEffect(() => {
        fetchData();
    }, []);

    // --- UI Logic uses the state data ---
    const currentData = statsData[activeTab.toUpperCase()];
    const isSports = activeTab === "sports";

    const chartConfig = {
        backgroundGradientFrom: COLORS.card,
        backgroundGradientTo: COLORS.card,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
        propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: COLORS.secondary,
        },
    };

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
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={{ color: COLORS.textGray, marginTop: 10 }}>Loading statistics...</Text>
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
                color={COLORS.textGray}
                iconName="calculator"
            />
            </View>

            {/* --- LINE CHART: P/L OVER TIME --- */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>P/L Trend (Cumulative)</Text>
                
                {/* Chart Period Toggle */}
                <ChartPeriodToggle activePeriod={chartPeriod} setActivePeriod={setChartPeriod} />

                {/* Line Chart */}
                {currentChartData.labels.length > 0 ? (
                    <LineChart
                        data={currentChartData}
                        width={screenWidth - 30}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                        formatYLabel={(y) => `${y}€`}
                    />
                ) : (
                    <View style={styles.noChartData}>
                        <Text style={styles.noChartText}>No bet data recorded in this period.</Text>
                    </View>
                )}
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

const chartToggleStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: 'space-around',
        backgroundColor: COLORS.background,
        borderRadius: 10,
        overflow: "hidden",
        height: 35,
        width: '90%',
        marginBottom: 10,
    },
    button: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 5,
    },
    activeButton: {
        backgroundColor: COLORS.primary,
    },
    text: {
        color: COLORS.textGray,
        fontSize: 12,
        fontWeight: "500",
    },
    activeText: {
        color: COLORS.textLight,
        fontWeight: 'bold',
    },
});

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
        color: COLORS.textLight,
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
    },
    itemType: {
        fontSize: 12,
        marginRight: 4,
        fontWeight: "300",
    },
    itemName: {
        fontSize: 15,
        color: COLORS.textLight,
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
    chartContainer: {
        marginVertical: 10,
        padding: 5,
        alignItems: "center",
        backgroundColor: COLORS.card,
        marginHorizontal: 15,
        borderRadius: 15,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textLight,
        alignSelf: "flex-start",
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 5,
    },
    chartStyle: {
        borderRadius: 15,
    },
    noChartData: {
        height: 220,
        width: screenWidth - 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noChartText: {
        color: COLORS.textGray,
        fontSize: 14,
    }
});
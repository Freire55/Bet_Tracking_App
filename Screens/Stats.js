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
import React, { useState, useEffect, memo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import SafeViewAndroid from "./SafeViewAndroid";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";

// DATA
import {
  getAllBets,
  getAllCasinoBets,
  getAllHouses,
  getAllSports,
  getCasinoProfitByHouse,
  getProfitByGame,
  getProfitBySport,
  getSportProfitByHouse,
  getTotalCasinoBalance,
  getTotalCasinoRisked,
  getTotalSportsBalance,
  getTotalSportsRisked,
  getAllGames,
  getProfitBySportAndHouse,
  getProfitByGameAndHouse,
  getCombinedSportsProfit,
  getCombinedCasinoProfit,
  getSportsBetTypeAnalysis,
  getSportsDailyProfit,
  getCasinoDailyProfit,
} from "../database/database";

// THEME
const COLORS = {
  primary: "#4C6EF5",
  secondary: "#17CAE6",
  background: "#FFFFFF",
  card: "#F8F9FA",
  positive: "#10B981",
  negative: "#EF4444",
  textDark: "#212529",
  textGray: "#6C757D",
  border: "#DEE2E6",
};

// STATE
const INITIAL_STATE = {
  SPORTS: {
    totalPL: 0,
    totalRisked: 0,
    winRate: "0.00%",
    bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    singleBreakdown: [],
    combinedBreakdown: [],
    betTypeAnalysis: [],
    dailyProfit: [],
  },
  CASINO: {
    totalPL: 0,
    totalRisked: 0,
    winRate: "0.00%",
    bets: 0,
    stats: { wins: 0, losses: 0, pushes: 0, total: 0 },
    singleBreakdown: [],
    combinedBreakdown: [],
    dailyProfit: [],
  },
};

// COMPONENTS

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

  const content =
    sortedData.length > 0 ? (
      sortedData.map(renderItem)
    ) : (
      <Text style={breakdownStyles.noData}>No data to display.</Text>
    );

  return (
    <View style={[styles.breakdownCard, { marginBottom: 10 }]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={breakdownStyles.container}>{content}</View>
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
          <Text style={breakdownStyles.itemName}>{item[primaryKey]}</Text>

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

  const content =
    sortedData.length > 0 ? (
      sortedData.map(renderItem)
    ) : (
      <Text style={breakdownStyles.noData}>No data to display.</Text>
    );

  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.cardTitle}>
        {primaryLabel} & House Profit Combinations
      </Text>

      <View style={breakdownStyles.container}>{content}</View>
    </View>
  );
};

const AccordionItem = memo(({ title, totalProfit, houseBreakdowns }) => {
  const [expanded, setExpanded] = useState(false);
  const profitColor = totalProfit >= 0 ? COLORS.positive : COLORS.negative;
  const profitSign = totalProfit >= 0 ? "+" : "";

  const activeHouses = houseBreakdowns.filter((h) => h.profit !== 0);

  return (
    <View style={{ overflow: "hidden", padding: 0 }}>
      <TouchableOpacity
        style={[
          breakdownStyles.itemRow,
          {
            paddingHorizontal: 15,
            paddingVertical: 15,
            borderBottomWidth: expanded ? 1 : 0,
            borderBottomColor: COLORS.border,
          },
        ]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={breakdownStyles.itemLeft}>
          <Text style={[breakdownStyles.itemName, { flex: 1 }]}>{title}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              breakdownStyles.itemProfit,
              { color: profitColor, marginRight: 10 },
            ]}
          >
            {profitSign}
            {totalProfit.toFixed(2)}€
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.textGray}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            backgroundColor: "#F1F5F9",
            paddingTop: 5,
            paddingBottom: 0,
          }}
        >
          {activeHouses.length > 0 ? (
            activeHouses.map((houseInfo, index) => {
              const hProfitColor =
                houseInfo.profit >= 0 ? COLORS.positive : COLORS.negative;
              const hProfitSign = houseInfo.profit >= 0 ? "+" : "";
              const isLastItem = index === activeHouses.length - 1;

              return (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderBottomWidth: isLastItem ? 0 : 1,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Styled Icon Container */}
                    <View
                      style={{
                        backgroundColor: COLORS.card,
                        padding: 6,
                        borderRadius: 8,
                        marginRight: 12,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="storefront-outline"
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: COLORS.textGray,
                      }}
                    >
                      {houseInfo.house}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: hProfitColor,
                    }}
                  >
                    {hProfitSign}
                    {houseInfo.profit.toFixed(2)}€
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={[breakdownStyles.noData, { paddingVertical: 15 }]}>
              No house data available.
            </Text>
          )}
        </View>
      )}
    </View>
  );
});

const BetTypeAnalysisCard = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.cardTitle}>Single Bets vs. Parlays</Text>
      <View style={breakdownStyles.container}>
        {data.map((item, index) => {
          const profitColor =
            item.total_profit >= 0 ? COLORS.positive : COLORS.negative;
          const profitSign = item.total_profit >= 0 ? "+" : "";

          return (
            <View key={index} style={breakdownStyles.itemRow}>
              <View style={breakdownStyles.itemLeft}>
                <Ionicons
                  name={
                    item.bet_type === "Single Bets"
                      ? "scan-outline"
                      : "layers-outline"
                  }
                  size={18}
                  color={COLORS.textGray}
                  style={{ marginRight: 8 }}
                />
                <View>
                  <Text style={breakdownStyles.itemName}>{item.bet_type}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textGray }}>
                    {item.wins}W - {item.losses}L ({item.total_bets} bets)
                  </Text>
                </View>
              </View>
              <Text
                style={[breakdownStyles.itemProfit, { color: profitColor }]}
              >
                {profitSign}
                {item.total_profit ? item.total_profit.toFixed(2) : "0.00"}€
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const PerformanceCharts = ({ currentData }) => {
  const [timeFilter, setTimeFilter] = useState("all");
  const screenWidth = Dimensions.get("window").width - 50;

  const totalDecided = currentData.stats.wins + currentData.stats.losses;
  const pieData = [
    {
      name: "Wins",
      population: currentData.stats.wins,
      color: COLORS.positive,
      legendFontColor: COLORS.textDark,
      legendFontSize: 14,
    },
    {
      name: "Losses",
      population: currentData.stats.losses,
      color: COLORS.negative,
      legendFontColor: COLORS.textDark,
      legendFontSize: 14,
    },
  ];

  let runningTotal = 0;
  const cumulativeData = (currentData.dailyProfit || []).map((item) => {
    runningTotal += item.daily_profit;
    return { date: new Date(item.date), balance: runningTotal };
  });

  const now = new Date();
  const filteredData = cumulativeData.filter((item) => {
    if (timeFilter === "30d") {
      return now - item.date <= 30 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === "12m") {
      return now - item.date <= 365 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  let lineLabels = ["Start"];
  let lineValues = [0];

  if (filteredData.length > 0) {
    const step = Math.ceil(filteredData.length / 5);
    lineLabels = filteredData.map((d, i) =>
      i % step === 0 || i === filteredData.length - 1
        ? `${d.date.getDate()}/${d.date.getMonth() + 1}`
        : "",
    );
    lineValues = filteredData.map((d) => d.balance);
  }

  const formatLargeNumbers = (value) => {
    const num = Number(value);

    if (isNaN(num)) return "0";

    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + "k";

    return num.toFixed(0);
  };

  const chartConfig = {
    backgroundColor: COLORS.card,
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    color: (opacity = 1) => `rgba(76, 110, 245, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
    strokeWidth: 3,
    useShadowColorFromDataset: false,
    propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primary },
  };

  return (
    <View style={{ paddingHorizontal: 15, marginBottom: 20 }}>
      <View style={styles.chartCard}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Text style={styles.chartTitle}>Bankroll Trend</Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: COLORS.background,
              borderRadius: 8,
              padding: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => setTimeFilter("30d")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor:
                  timeFilter === "30d" ? COLORS.primary : "transparent",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: timeFilter === "30d" ? "#FFF" : COLORS.textGray,
                }}
              >
                30D
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeFilter("12m")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor:
                  timeFilter === "12m" ? COLORS.primary : "transparent",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: timeFilter === "12m" ? "#FFF" : COLORS.textGray,
                }}
              >
                12M
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeFilter("all")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor:
                  timeFilter === "all" ? COLORS.primary : "transparent",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: timeFilter === "all" ? "#FFF" : COLORS.textGray,
                }}
              >
                ALL
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LineChart
          data={{ labels: lineLabels, datasets: [{ data: lineValues }] }}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          withDots={false}
          formatYLabel={formatLargeNumbers}
          style={{ borderRadius: 16, marginLeft: -10 }}
        />
      </View>

      {totalDecided > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Accuracy (Win / Loss)</Text>
          <PieChart
            data={pieData}
            width={screenWidth}
            height={160}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}
    </View>
  );
};

// MAIN
const Stats = () => {
  const [activeTab, setActiveTab] = useState("sports");
  const [statsData, setStatsData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const betsArray = (await getAllBets()) || [];
      const casinoBetsArray = (await getAllCasinoBets()) || [];
      const housesArray = (await getAllHouses()) || [];
      const sportsArray = (await getAllSports()) || [];
      const gamesArray = (await getAllGames()) || [];

      const sportBalance = (await getTotalSportsBalance()) || 0;
      const casinoBalance = (await getTotalCasinoBalance()) || 0;
      const sportRisked = (await getTotalSportsRisked()) || 0;
      const casinoRisked = (await getTotalCasinoRisked()) || 0;

      const sportsWins = betsArray.filter(
        (b) => b.amount_won - b.amount_bet > 0,
      ).length;
      const casinoWins = casinoBetsArray.filter(
        (b) => b.amount_won - b.amount_bet > 0,
      ).length;
      const sportsTotal = betsArray.length;
      const casinoTotal = casinoBetsArray.length;

      const sportsWinRate =
        sportsTotal > 0
          ? ((sportsWins / sportsTotal) * 100).toFixed(2) + "%"
          : "0.00%";
      const casinoWinRate =
        casinoTotal > 0
          ? ((casinoWins / casinoTotal) * 100).toFixed(2) + "%"
          : "0.00%";

      let sportsSingleBreakdown = [];
      let casinoSingleBreakdown = [];
      let sportsCombinedBreakdown = [];
      let casinoCombinedBreakdown = [];
      let idCounter = 1;

      for (let sport of sportsArray) {
        const profit = await getProfitBySport(sport.id);
        sportsSingleBreakdown.push({
          id: sport.id,
          name: sport.sport_name || sport.name,
          type: "Sport",
          profit: profit || 0,
        });
      }
      for (let game of gamesArray) {
        const profit = await getProfitByGame(game.id);
        casinoSingleBreakdown.push({
          id: game.id,
          name: game.game_name || game.name,
          type: "Game",
          profit: profit || 0,
        });
      }
      for (let house of housesArray) {
        const sportProfit = await getSportProfitByHouse(house.id);
        const casinoProfit = await getCasinoProfitByHouse(house.id);

        const houseName = house.house_name || house.name;

        if (sportProfit !== undefined && sportProfit !== null) {
          sportsSingleBreakdown.push({
            id: house.id + "H",
            name: houseName,
            type: "House",
            profit: sportProfit,
          });
        }
        if (casinoProfit !== undefined && casinoProfit !== null) {
          casinoSingleBreakdown.push({
            id: house.id + "H",
            name: houseName,
            type: "House",
            profit: casinoProfit,
          });
        }
      }

      const sportsCombinedData = (await getCombinedSportsProfit()) || [];
      const casinoCombinedData = (await getCombinedCasinoProfit()) || [];

      const betTypeData = (await getSportsBetTypeAnalysis()) || [];
      const dailyProfitData = (await getSportsDailyProfit()) || [];
      const casinoDailyProfitData = (await getCasinoDailyProfit()) || [];

      sportsCombinedBreakdown = sportsCombinedData.map((item) => ({
        id: idCounter++,
        sport: item.sport,
        house: item.house,
        profit: item.profit || 0,
      }));

      casinoCombinedBreakdown = casinoCombinedData.map((item) => ({
        id: idCounter++,
        game: item.game,
        house: item.house,
        profit: item.profit || 0,
      }));

      const newStats = {
        SPORTS: {
          totalPL: sportBalance,
          totalRisked: sportRisked,
          winRate: sportsWinRate,
          bets: sportsTotal,
          stats: {
            wins: sportsWins,
            losses: sportsTotal - sportsWins,
            pushes: 0,
            total: sportsTotal,
          },
          singleBreakdown: sportsSingleBreakdown,
          combinedBreakdown: sportsCombinedBreakdown,
          betTypeAnalysis: betTypeData,
          dailyProfit: dailyProfitData,
        },
        CASINO: {
          totalPL: casinoBalance,
          totalRisked: casinoRisked,
          winRate: casinoWinRate,
          bets: casinoTotal,
          stats: {
            wins: casinoWins,
            losses: casinoTotal - casinoWins,
            pushes: 0,
            total: casinoTotal,
          },
          singleBreakdown: casinoSingleBreakdown,
          combinedBreakdown: casinoCombinedBreakdown,
          dailyProfit: casinoDailyProfitData,
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

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  const currentData = statsData[activeTab.toUpperCase()];
  const isSports = activeTab === "sports";

  const profitColor =
    currentData.totalPL >= 0 ? COLORS.positive : COLORS.negative;

  const singleSportGameData = currentData.singleBreakdown.filter(
    (item) => item.type === (isSports ? "Sport" : "Game"),
  );
  const singleHouseData = currentData.singleBreakdown.filter(
    (item) => item.type === "House",
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          SafeViewAndroid.AndroidSafeArea,
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textDark, marginTop: 10 }}>
          Loading statistics...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
      <ScrollView style={styles.scrollView}>
        <View style={{ marginHorizontal: 15, marginBottom: 15 }}>
          <StatsToggle activeTab={activeTab} setActiveTab={setActiveTab} />
        </View>

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

        {isSports && currentData.betTypeAnalysis?.length > 0 && (
          <BetTypeAnalysisCard data={currentData.betTypeAnalysis} />
        )}

        <PerformanceCharts currentData={currentData} isSports={isSports} />

        <SingleBreakdownList
          data={singleSportGameData}
          title={isSports ? "Profit by Sport" : "Profit by Game"}
        />

        <View style={{ paddingBottom: 40 }}>
          <Text style={styles.cardTitle}>
            {isSports ? "Profit by House & Sport" : "Profit by House & Game"}
          </Text>

          {/* WRAPPER CONTAINER: This acts as the single card */}
          <View style={[styles.breakdownCard]}>
            {Array.from(
              new Set(currentData.combinedBreakdown.map((c) => c.house)),
            )
              .map((houseName) => {
                const houseCombinations = currentData.combinedBreakdown.filter(
                  (c) => c.house === houseName,
                );
                const totalHouseProfit = houseCombinations.reduce(
                  (sum, c) => sum + c.profit,
                  0,
                );
                return { houseName, houseCombinations, totalHouseProfit };
              })
              .sort((a, b) => b.totalHouseProfit - a.totalHouseProfit) // Sorting logic
              .map((item, index, array) => (
                <View
                  key={item.houseName}
                  style={{
                    borderBottomWidth: index === array.length - 1 ? 0 : 1,
                    borderBottomColor: COLORS.border,
                    width: "100%",
                  }}
                >
                  <AccordionItem
                    title={item.houseName}
                    totalProfit={item.totalHouseProfit}
                    houseBreakdowns={item.houseCombinations.map((c) => ({
                      house: isSports ? c.sport : c.game,
                      profit: c.profit,
                    }))}
                  />
                </View>
              ))}
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Stats;

// STYLES

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
    flexWrap: "wrap",
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
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 10,
  },
});

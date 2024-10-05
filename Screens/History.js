import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SafeViewAndroid from "./SafeViewAndroid";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const History = () => {
  const navigation = useNavigation();

  const goHome = () => {
    navigation.navigate("Home");
  };

  const goStats = () => {
    navigation.navigate("Stats");
  };

  const [history, setHistory] = useState([]);

  const icons = [
    { label: "NBA", icon: "basketball", color: "#17CAE6" },
    { label: "Futebol", icon: "football", color: "#17CAE6" },
    { label: "Others", icon: "cash", color: "#17CAE6" },
  ];

  const retrieveHistory = async () => {
    setHistory(JSON.parse(await AsyncStorage.getItem("transactions")) || []);

    // GET TOTAL RISKED
  };

  const getRisked = () => {
    let risked = 0;
    history.map((transaction, index) => {
      risked += transaction[1];
    });
    return risked;
  };

  const deleteBet = async (index) => {
    Alert.alert(
      "Delete Bet",
      "Are you sure you want to delete this bet?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            // Retrieve the selected bet to modify totals and ratios
            const betToDelete = history[history.length - index - 1];
            const [selectedItem, bet, payout, legs, date, result] = betToDelete;

            // Update the win-loss ratio based on the result of the bet
            const winsKey = `${selectedItem}_wins`;
            const lossesKey = `${selectedItem}_losses`;
            const totalKey = selectedItem;

            const savedWins =
              JSON.parse(await AsyncStorage.getItem(winsKey)) || 0;
            const savedLosses =
              JSON.parse(await AsyncStorage.getItem(lossesKey)) || 0;
            const savedTotal =
              JSON.parse(await AsyncStorage.getItem(totalKey)) || 0;

            // Adjust totals and W-L ratios depending on result
            if (result === "Win") {
              await AsyncStorage.setItem(
                winsKey,
                JSON.stringify(savedWins - 1)
              );
            } else if (result === "Loss") {
              await AsyncStorage.setItem(
                lossesKey,
                JSON.stringify(savedLosses - 1)
              );
            }

            // Update the total for the specific sport
            const updatedTotal = savedTotal - (payout - bet);
            await AsyncStorage.setItem(totalKey, JSON.stringify(updatedTotal));

            // Remove the bet at the specified index
            let updatedBets = [...history];
            updatedBets.splice(history.length - index - 1, 1);
            setHistory(updatedBets);

            // Update AsyncStorage with the updated bets array
            await AsyncStorage.setItem(
              "transactions",
              JSON.stringify(updatedBets)
            );
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    retrieveHistory();
  }, []);

  return (
    <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
      <View className="h-full">
        {/* HEADER */}
        <View style={styles.header}>
          {/* Week, Month, Year Tabs */}
          <View className="w-full flex flex-row justify-between">
            <TouchableOpacity onPress={goHome}>
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goStats}>
              <Text className="text-white">Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Currency */}
        </View>

        {/* HISTORY */}
        <View className="h-full">
          <Text className="text-white self-center mt-3">
            TOTAL BETTED: {getRisked()}€
          </Text>
          <ScrollView className="mt-5 mb-16" alwaysBounceVertical>
            {history
              .slice()
              .reverse()
              .map((transaction, index) => {
                const iconObject = icons.find(
                  (icon) => icon.label === transaction[0]
                );

                // Fallback to default values if no match is found
                const iconName = iconObject ? iconObject.icon : "help"; // default icon
                const iconColor = iconObject ? iconObject.color : "#A9A9A9"; // default color
                return (
                  <TouchableOpacity
                    onLongPress={() => deleteBet(index)}
                    key={index}
                    className={
                      index === history.length - 1
                        ? "mx-3 px-3 mb-5 bg-darkNavy "
                        : "mx-3 px-3 bg-darkNavy "
                    }
                    style={styles.card}
                  >
                    <Ionicons name={iconName} size={44} color={iconColor} />
                    <View style={styles.leftContainer}>
                      {/* Assuming these icons are the transaction icons */}
                      <Text
                        style={styles.recordText1}
                        className="text-lg font-semibold"
                      >
                        {transaction[1]}€ -{">  " + transaction[2]}€
                      </Text>
                      <View className="flex flex-row mt-4">
                        <Text style={styles.recordText} className="text-sm">
                          {transaction[3]} leg-parlay
                        </Text>
                        <Text style={styles.recordText} className="text-sm">
                          Resulted in a {transaction[5]}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.rightContainer}
                      className="justify-between h-full py-3"
                    >
                      <Text style={styles.amountText}>{transaction[4]}</Text>
                      <Text style={styles.sportText}>{transaction[0]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071A2F", // Dark navy background
  },
  header: {
    backgroundColor: "#071A2F", // Dark navy background
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 95,
    borderWidth: 0.8, // Thickness of the border
    borderColor: "#7f8c8d", // Color of the border
  },
  leftContainer: {
    alignItems: "center",
  },
  recordText: {
    color: "#fff",
    marginLeft: 10,
  },
  recordText1: {
    color: "#17CAE6",
    marginLeft: 10,
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  amountText: {
    color: "#17CAE6",
    // color: "#CC3EBF",
    fontWeight: "bold",
  },
  sportText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});

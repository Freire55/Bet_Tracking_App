import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import SafeViewAndroid from "./SafeViewAndroid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import PagerView from "react-native-pager-view";

const Home = () => {
  const navigation = useNavigation();

  const goHistory = () => {
    navigation.navigate("History");
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [info, setInfo] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bet, setBet] = useState(0);
  const [payout, setPayout] = useState(0);
  const [legs, setLegs] = useState(0);
  const [totals, setTotals] = useState([0, 0, 0, 0]);
  const [history, setHistory] = useState([]);
  const [ratios, setRatios] = useState([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);

  const data = [
    {
      key: "1",
      text: "TOTAL",
      valor: totals[0],
      ratios: ratios[0],
    },
    {
      key: "2",
      text: "NBA",
      valor: totals[1],
      ratios: ratios[1],
    },
    {
      key: "3",
      text: "FUTEBOL",
      valor: totals[2],
      ratios: ratios[2],
    },
    {
      key: "4",
      text: "Others",
      valor: totals[3],
      ratios: ratios[3],
    },
  ];

  const options = [
    { id: "1", label: "NBA" },
    { id: "2", label: "Futebol" },
    { id: "3", label: "Others" },
  ];

  // useEffect(() => {
  //   retrieveInfo();
  // }, []);

  // Use useFocusEffect to trigger when the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      // Trigger re-fetching of data when returning to this screen
      retrieveInfo();
    }, [])
  );

  const retrieveInfo = async () => {
    const nbaTotal = JSON.parse(await AsyncStorage.getItem("NBA")) || 0;
    const futTotal = JSON.parse(await AsyncStorage.getItem("Futebol")) || 0;
    const OthersTotal = JSON.parse(await AsyncStorage.getItem("Others")) || 0;

    const total = nbaTotal + futTotal + OthersTotal;

    // Now update the totals state
    setTotals([total, nbaTotal, futTotal, OthersTotal]);

    const nbaRatio = [
      JSON.parse(await AsyncStorage.getItem("NBA_wins")) || 0,
      JSON.parse(await AsyncStorage.getItem("NBA_losses")) || 0,
    ];
    const futRatio = [
      JSON.parse(await AsyncStorage.getItem("Futebol_wins")) || 0,
      JSON.parse(await AsyncStorage.getItem("Futebol_losses")) || 0,
    ];
    const othersRatio = [
      JSON.parse(await AsyncStorage.getItem("Others_wins")) || 0,
      JSON.parse(await AsyncStorage.getItem("Others_losses")) || 0,
    ];

    const totalRatio = [
      nbaRatio[0] + futRatio[0] + othersRatio[0],
      nbaRatio[1] + futRatio[1] + othersRatio[1],
    ];

    setRatios([totalRatio, nbaRatio, futRatio, othersRatio]);

    setHistory(JSON.parse(await AsyncStorage.getItem("transactions")) || []);
  };

  const handleSelect = (item) => {
    setSelectedItem(item.label);
  };

  const handleBetChange = (bet) => {
    setBet(parseFloat(bet));
  };

  const handlePayoutChange = (payout) => {
    setPayout(parseFloat(payout));
  };

  const handleLegsChange = (legs) => {
    setLegs(parseFloat(legs));
  };

  const handleTransaction = async () => {
    // Get Date
    const day = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const date = `${day}/${month}/${year}`;

    const result = bet > payout ? "Loss" : "Win";

    const transaction = [selectedItem, bet, payout, legs, date, result];

    // HANDLING THE TRANSACTION

    // Get existing transactions
    const existingTransactions =
      JSON.parse(await AsyncStorage.getItem("transactions")) || [];

    // push new transaction
    existingTransactions.push(transaction);

    // Save the updated list of transactions
    await AsyncStorage.setItem(
      "transactions",
      JSON.stringify(existingTransactions)
    );

    // HANDLING THE TOTALS

    const savedTotal =
      JSON.parse(await AsyncStorage.getItem(selectedItem)) || 0;

    // HANDLING THE W-L RATIO

    // const savedWins = JSON.parse(await AsyncStorage.getItem(selectedItem[1])) || 0
    // const savedLosses = JSON.parse(await AsyncStorage.getItem(selectedItem[2])) || 0

    const savedWins =
      JSON.parse(await AsyncStorage.getItem(`${selectedItem}_wins`)) || 0;
    const savedLosses =
      JSON.parse(await AsyncStorage.getItem(`${selectedItem}_losses`)) || 0;

    await AsyncStorage.setItem(
      selectedItem,
      JSON.stringify(savedTotal + (payout - bet))
    );

    result == "Win"
      ? (await AsyncStorage.setItem(
          `${selectedItem}_wins`,
          JSON.stringify(savedWins + 1)
        ),
        await AsyncStorage.setItem(
          `${selectedItem}_losses`,
          JSON.stringify(savedLosses)
        ))
      : (await AsyncStorage.setItem(
          `${selectedItem}_wins`,
          JSON.stringify(savedWins)
        ),
        await AsyncStorage.setItem(
          `${selectedItem}_losses`,
          JSON.stringify(savedLosses + 1)
        ));

    // console.log(ratios)
    retrieveInfo();

    // deleteStorage()
  };

  const deleteStorage = async () => {
    await AsyncStorage.clear();
  };

  const handleNoInfo = () => {
    setInfo(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View className="flex-1">
        {/* Sidebar */}
        <View
          style={styles.sidebar}
          className=" h-64 self-center w-full flex items-center justify-center align-middle"
        >
          <PagerView
            className=" flex-1 w-full mt-8 items-center justify-center self-center"
            initialPage={0}
            pageMargin={50}
          >
            {data.map((page) => {
              return (
                <View
                  style={styles.sidebarItem}
                  className="justify-center w-68"
                  key={page.key}
                >
                  <Text
                    style={styles.sidebarText}
                    className="self-center text-2xl"
                  >
                    {page.text}
                  </Text>
                  <Text
                    style={styles.sidebarText}
                    className="self-center text-2xl"
                  >
                    {page.ratios[0] + " - " + page.ratios[1]}
                  </Text>

                  <Text
                    style={styles.balanceText}
                    className="self-center text-2xl"
                  >
                    {page.valor != 0 ? page.valor.toFixed(2) : page.valor}€
                  </Text>
                </View>
              );
            })}
          </PagerView>
        </View>

        {/* Other sidebar items */}

        {/* Main Content */}
        <ScrollView style={styles.container}>
          {/* Transaction Type */}
          <View style={styles.card} className="mb-6">
            <Text style={styles.cardTitle}>Bet Type</Text>
            <View style={styles.inputArea}>
              {/* Checkbox and text for each transaction type */}

              <View style={styles.transactionType}>
                {options.map((item) => {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.inputField,
                        selectedItem === item.label &&
                          styles.selectedTransaction,
                      ]}
                      onPress={() => {
                        handleSelect(item);
                      }}
                    >
                      <Text className="self-center">{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Repeat for other transaction types */}
            </View>
          </View>

          {/* Input Area */}
          <View style={styles.card} className="mb-6">
            <Text style={styles.cardTitle}>Input Area</Text>
            <View style={styles.inputArea}>
              <TextInput
                style={styles.inputField}
                placeholder="Enter Bet"
                keyboardType="numeric"
                onChangeText={handleBetChange}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Enter Payout"
                keyboardType="numeric"
                onChangeText={handlePayoutChange}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.card} className="mb-3">
            <Text style={styles.cardTitle}>Legs</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter Legs"
              keyboardType="numeric"
              onChangeText={handleLegsChange}
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            className="mb-6"
            style={styles.button}
            onPress={
              bet && selectedItem && legs ? handleTransaction : handleNoInfo
            }
          >
            <Text style={styles.buttonText}>🤑🤑 Fucking Cash 🤑🤑</Text>
          </TouchableOpacity>

          {/* History */}
          <View
            style={styles.historyButtonContainer}
            className="flex flex-row justify-between"
          >
            <Text className="mb-5" style={styles.historyButtonText}>
              {" "}
              Last 4 plays
            </Text>
            <TouchableOpacity onPress={goHistory}>
              <Text style={styles.historyButtonText} className="mb-5">
                See History
                <AntDesign name="arrowright" size={17} color="#FFFFFF" />
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            {history
              .slice()
              .reverse()
              .slice(0, 4)
              .map((transaction, index) => (
                <View
                  style={styles.card}
                  key={index}
                  className="rounded-xl flex mb-3"
                >
                  <Text className="absolute right-8 top-2 font-semibold">
                    {transaction[4]}
                  </Text>
                  <Text className="text-xl font-semibold absolute left-3 top-1">
                    {transaction[0]}
                  </Text>

                  <Text className="text-lg font-medium self-center mt-2">
                    {transaction[1] + " -> " + transaction[2]}
                  </Text>
                  <View className="flex flex-row justify-around mt-2">
                    <Text className="text-base font-normal self-center">
                      {transaction[3]} leg-parlay
                    </Text>
                    <Text className="text-base font-normal self-center">
                      Resulted in {transaction[5]}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  selectedTransaction: {
    backgroundColor: "#19E1FF", // Highlighted background when selected
  },
  screen: {
    flex: 1,
    backgroundColor: "#071A2F", // Dark navy background
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  sidebar: {
    // backgroundColor: "#0C1536", // Darker blue for sidebar
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "space-between",
  },
  sidebarItem: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    // marginLeft: 2,
  },
  sidebarText: {
    color: "#FFFFFF",
    marginBottom: 5,
  },
  balanceText: {
    color: "#19E1FF", // Teal for balance
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    // marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    color: "#0C1536", // Dark blue for titles
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardText: {
    color: "#071A2F", // Slightly lighter blue for text
    fontSize: 16,
    marginBottom: 5,
  },
  transactionTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  transactionType: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionTypeText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontSize: 16,
  },
  inputArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputField: {
    backgroundColor: "#F5F8FD", // Light background for inputs
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#333",
    flex: 1,
    marginRight: 10,
    // textAlign: "center",
  },
  dateIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "30%",
  },
  descriptionArea: {
    marginBottom: 20,
  },
  descriptionText: {
    color: "#071A2F", // Text color
    fontSize: 16,
  },
  colorPalette: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  timeframeContainer: {
    alignItems: "center",
  },
  timeframeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#FF4DF7", // Magenta button
    borderRadius: 30,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  historyButtonContainer: {
    // alignItems: "flex-end",
    marginTop: 10,
  },
  historyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    flexDirection: "row",
    alignItems: "center",
  },
});

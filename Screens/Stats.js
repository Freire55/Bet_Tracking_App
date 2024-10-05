// import {
//   View,
//   Text,
//   ScrollView,
//   SafeAreaView,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import React, { useEffect, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import SafeViewAndroid from "./SafeViewAndroid";
// import { useNavigation } from "@react-navigation/native";
// import { Ionicons } from "@expo/vector-icons";
// import {} from "./Home";
// import { LineChart } from "react-native-chart-kit";

// const Stats = () => {
//   const navigation = useNavigation();

//   const goHistory = () => {
//     navigation.navigate("History");
//   };

//   const [transactions, setTransactions] = useState([]);
//   const [totals, setTotals] = useState([]);
//   const [odds, setOdds] = useState([0, 0, 0, 0])
//   const [ratios, setRatios] = useState([
//     [0, 0],
//     [0, 0],
//     [0, 0],
//     [0, 0],
//   ]);

//   const data = [
//     {
//       key: "1",
//       text: "TOTAL",
//       valor: totals[0],
//       ratios: ratios[0],
//     },
//     {
//       key: "2",
//       text: "NBA",
//       valor: totals[1],
//       ratios: ratios[1],
//     },
//     {
//       key: "3",
//       text: "FUTEBOL",
//       valor: totals[2],
//       ratios: ratios[2],
//     },
//     {
//       key: "4",
//       text: "Others",
//       valor: totals[3],
//       ratios: ratios[3],
//     },
//   ];
  
//   const retrieveHistory = async () => {
//     setTransactions(
//       JSON.parse(await AsyncStorage.getItem("transactions")) || []
//     );
    
    
//     const nbaTotal =
//     Math.round(JSON.parse((await AsyncStorage.getItem("NBA")) * 100) / 100) ||
//     0;
//     const futTotal =
//     Math.round(
//       JSON.parse((await AsyncStorage.getItem("Futebol")) * 100) / 100
//     ) || 0;
//     const OthersTotal =
//     Math.round(
//       JSON.parse((await AsyncStorage.getItem("Others")) * 100) / 100
//     ) || 0;
    
//     const total = nbaTotal + futTotal + OthersTotal;
    
//     // Now update the totals state
//     setTotals([total, nbaTotal, futTotal, OthersTotal]);
    
//     const nbaRatio = [
//       JSON.parse(await AsyncStorage.getItem("NBA_wins")) || 0,
//       JSON.parse(await AsyncStorage.getItem("NBA_losses")) || 0,
//     ];
//     const futRatio = [
//       JSON.parse(await AsyncStorage.getItem("Futebol-wins")) || 0,
//       JSON.parse(await AsyncStorage.getItem("Futebol_losses")) || 0,
//     ];
//     const othersRatio = [
//       JSON.parse(await AsyncStorage.getItem("Others-wins")) || 0,
//       JSON.parse(await AsyncStorage.getItem("Others_losses")) || 0,
//     ];
    
//     const totalRatio = [
//       nbaRatio[0] + futRatio[0] + othersRatio[0],
//       nbaRatio[1] + futRatio[1] + othersRatio[1],
//     ];
    
//     setRatios([totalRatio, nbaRatio, futRatio, othersRatio]);
    
    
//     averageOdds();
    
//   };
  
//   const handleTransactionType = () => {
//     // DIVIDE THE DIFFERENT TYPE OF TRANSACTIONS
    
//   };
  
//   const validateOdds = (odds) => {
//     return odds.map(odd => isNaN(odd) ? 0 : odd);
//   };
  
//   const averageOdds = () => {
//     const totalOdds = calculateOdds(" ") || 0;
//     const nbaOdds = calculateOdds("NBA") || 0;
//     const futOdds = calculateOdds("Futebol") || 0;
//     const otherOdds = calculateOdds("Others") || 0;
    
//     setOdds(validateOdds([totalOdds, nbaOdds, futOdds, otherOdds]).map((odd) => parseFloat(odd) || 0));
//     console.log(odds)
//   };
  
//   const calculateOdds = (type) => {
//     let filteredTransactions =
//     (type != " "
//       ? transactions.filter((item) => item[0] === type)
//       : transactions);
//       filteredTransactions = filteredTransactions.filter(
//         (item) => item[5] != "Loss"
//       );
//       let totalOdd = 0;
//       let count = 0;
//       filteredTransactions.map((item) => {
//         count++;
//         totalOdd += item[2] / item[1];
//       });
//       totalOdd /= count;
//       return totalOdd || 0;
//     };
    
//     const percentageWins = () => {
//       let lowRisk = 0;
//       let medRisk = 0;
//       let highRisk = 0;
//       let count = 0;
      
//       let filteredTransactions = transactions.filter((item) => item[5] != "Loss");
      
//       filteredTransactions.map((item) => {
//         count++;
//         if (item[2] / item[1] < 2.3) {
//           lowRisk++;
//         } else if (item[2] / item[1] < 4) {
//           medRisk++;
//         } else {
//           highRisk++;
//         } 
//       });
//       const precLow = (lowRisk / count) * 100;
//       const precMed = (medRisk / count) * 100;
//       const precHigh = (highRisk / count) * 100;
      
//     };
    
//     useEffect(() => {
//       retrieveHistory();
//     }, []);
    
//     return (
//       <SafeAreaView style={[SafeViewAndroid.AndroidSafeArea, styles.screen]}>
//       <TouchableOpacity onPress={goHistory}>
//         <Text className="text-white">Go Back</Text>
//       </TouchableOpacity>

//       {/* GRAPHS (Average odds on wins, percentage of wins depending on odds, last week/ last month/ total made) */}
//       <View>
//         <LineChart
//           data={{
//             labels: ["Total", "NBA", "Futebol", "Others"],
//             datasets: [
//               {
//                 data:  odds
//               }
//             ]
//           }}
//           width={Dimensions.get("window").width - 20} // from react-native
//           height={220}
//           yAxisInterval={1} // optional, defaults to 1
//           chartConfig={{
//             backgroundColor: "#e26a00",
//             backgroundGradientFrom: "#fb8c00",
//             backgroundGradientTo: "#ffa726",
//             decimalPlaces: 2, // optional, defaults to 2dp
//             color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//             labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//             style: {
//               borderRadius: 16
//             },
//             propsForDots: {
//               r: "6",
//               strokeWidth: "2",
//               stroke: "#ffa726"
//             }
//           }}
//           segments={3}
//           bezier
//           style={{
//             marginVertical: 8,
//             borderRadius: 16
//           }}
//         />
//       </View>
//       {/* MOST IN A DAY/MONTH */}

//       {/* MONEY BETTED AND GAINED */}
//     </SafeAreaView>
//   );
// };

// export default Stats;

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: "#071A2F", // Dark navy background
//   },
// });

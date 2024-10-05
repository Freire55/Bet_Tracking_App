import React from 'react';
import {View, StyleSheet} from 'react-native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from './Screens/Home';
import History from './Screens/History';
// import Stats from './Screens/Stats';



const Stack = createNativeStackNavigator()

const StackNavigator = () => {
    return (
       <Stack.Navigator
        screenOptions={{
            headerShown: false,
            // presentation: 'containedTransparentModal',
            // animationTypeForReplace: 'push',
            animation: 'fade',
            orientation: 'portrait_up' ,
        }}
        >
            <Stack.Screen name="Home" component={Home} />    
            <Stack.Screen name="History" component={History} />    
            {/* <Stack.Screen name="Stats" component={Stats} />     */}
        </Stack.Navigator>
    );
}

export default StackNavigator;

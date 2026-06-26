import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { connectDb, createTables } from './database/database';
import SideBar from './components/SideBar';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function initializeDatabase() {
      try {
        await connectDb(); 
        await createTables(); 
        setIsDbReady(true);
        console.log("Database initialized successfully.");
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    }

    initializeDatabase();
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#19E1FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StackNavigator />
      <SideBar />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#071A2F',
  },
});
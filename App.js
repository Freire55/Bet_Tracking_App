import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import React, { useEffect, useState } from 'react'; // 👈 Import useState
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // 👈 For loading screen
import { connectDb, createTables } from './database/database'; // 👈 Import both connectDb and createTables
import SideBar from './components/SideBar';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function initializeDatabase() {
      try {
        // 1. AWAIT the database connection
        await connectDb(); 
        
        // 2. AWAIT the table creation
        await createTables(); 
        
        // 3. Mark the database as ready
        setIsDbReady(true);
        console.log("Database initialized successfully.");
      } catch (error) {
        console.error("Failed to initialize database:", error);
        // Handle error state (e.g., show an error screen)
      }
    }

    initializeDatabase();
  }, []);

  // Show a loading screen while the database is being initialized
  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#19E1FF" />
      </View>
    );
  }

  // Once the database is ready, render the navigation stack
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
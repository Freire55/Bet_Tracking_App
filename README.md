# Bet Balance Tracking App

A React Native mobile application for tracking sports betting and casino gambling activities. Built with Expo and SQLite, this app helps users monitor their betting performance, analyze statistics, and manage their gambling budget across different betting houses and games.

## 📱 Features

### Sports Betting
- **Track Sports Bets**: Record bets with details including:
  - Sport type (customizable)
  - Betting house
  - Bet amount
  - Payout amount
  - Number of legs (for parlays/accumulators)
- **Sport Categories**: Add and manage custom sport categories
- **Real-time Balance**: View current sports betting balance
- **Profit Tracking**: Monitor profit/loss by sport type

### Casino Games
- **Track Casino Bets**: Record casino gambling sessions with:
  - Game type (slots, blackjack, roulette, etc.)
  - Betting house
  - Bet amount
  - Payout amount
- **Game Categories**: Add and manage custom casino games
- **Casino Balance**: Track overall casino gambling balance
- **Game Performance**: Analyze profit/loss by game type

### Betting History
- **Complete History**: View all past bets (sports and casino)
- **Bet Details**: See comprehensive information for each bet including:
  - Date and time
  - Bet type
  - Amount risked
  - Payout received
  - Net profit/loss
- **Edit & Delete**: Modify or remove past bets
- **Separate Views**: Toggle between sports and casino history
- **Total Statistics**: View total amounts risked in each category

### Statistics & Analytics
- **Overall Performance**:
  - Total profit/loss
  - Total amount risked
  - Win rate percentage
  - Total number of bets
- **Win/Loss/Push Breakdown**: Track bet outcomes
- **Single vs Combined Bets**: Analyze performance of:
  - Single bets (1 leg)
  - Parlays/accumulators (multiple legs)
- **By Category**: View statistics broken down by:
  - Sport type
  - Casino game type
  - Betting house
- **Visual Indicators**: Color-coded profit (green) and loss (red) displays

### Betting Houses
- **Manage Houses**: Add custom betting houses/platforms
- **House-specific Tracking**: Monitor performance at each betting house
- **Profit by House**: Analyze which houses are most profitable

## 🛠️ Technology Stack

### Frontend
- **React Native** (v0.81.5) - Mobile app framework
- **Expo** (v54.0.27) - Development and build tooling
- **React Navigation** (v6.1.6) - Screen navigation
  - Native Stack Navigator
  - Bottom Tabs Navigator
- **NativeWind** (v2.0.11) - Tailwind CSS for React Native
- **React Native Chart Kit** (v6.12.0) - Data visualization

### Database
- **expo-sqlite** (v16.0.10) - Local SQLite database
- **AsyncStorage** - Local data persistence

### UI Components
- **React Native Pager View** - Swipeable views
- **React Native Date Picker** - Date selection
- **React Native Gesture Handler** - Touch gestures
- **React Native Reanimated** - Smooth animations
- **@expo/vector-icons** - Icon library (MaterialIcons, FontAwesome5, Ionicons)

### Additional Libraries
- **axios** - HTTP client
- **react-native-keyboard-aware-scroll-view** - Keyboard handling
- **react-native-svg** - SVG support for charts

## 🗄️ Database Schema

### Tables

#### `sport`
- `id` (INTEGER PRIMARY KEY)
- `sport_name` (TEXT)

#### `game`
- `id` (INTEGER PRIMARY KEY)
- `game_name` (TEXT)

#### `house`
- `id` (INTEGER PRIMARY KEY)
- `house_name` (TEXT)

#### `bet`
Sports betting records:
- `id` (INTEGER PRIMARY KEY)
- `sport_id` (INTEGER, FK)
- `house_id` (INTEGER, FK)
- `bet_amount` (REAL)
- `payout` (REAL)
- `legs` (INTEGER)
- `date` (TEXT)

#### `casino_bet`
Casino betting records:
- `id` (INTEGER PRIMARY KEY)
- `game_id` (INTEGER, FK)
- `house_id` (INTEGER, FK)
- `bet_amount` (REAL)
- `payout` (REAL)
- `date` (TEXT)

#### Budget Tables
- `sport_budget` - Sports betting budget tracking
- `casino_budget` - Casino betting budget tracking


## 📱 Usage

### Adding a Bet

#### Sports Bet
1. Navigate to the **Sports** screen
2. Select a sport type (or add a new one)
3. Select a betting house (or add a new one)
4. Enter bet amount
5. Enter payout amount (0 for losses)
6. Specify number of legs (1 for single bets, 2+ for parlays)
7. Submit the bet

#### Casino Bet
1. Navigate to the **Casino** screen
2. Select a game type (or add a new one)
3. Select a betting house
4. Enter bet amount
5. Enter payout amount (0 for losses)
6. Submit the bet

### Viewing History
1. Navigate to the **History** screen
2. Toggle between Sports and Casino tabs
3. View all past bets with details
4. Edit or delete bets by tapping on them

### Analyzing Statistics
1. Navigate to the **Stats** screen
2. Toggle between Sports and Casino tabs
3. View comprehensive statistics including:
   - Overall profit/loss
   - Win rate
   - Total bets and amount risked
   - Performance by category
   - Single vs combined bet analysis

## 🎨 Design

The app uses a modern, clean design with:
- **Color Scheme**:
  - Primary: Blue (#4C6EF5)
  - Accent: Pink (#FF4DF7)
  - Positive: Green (#10B981)
  - Negative: Red (#EF4444)
  - Background: Light (#F5F8FD)
- **Typography**: Clean, readable fonts
- **Icons**: Material Icons, FontAwesome5, and Ionicons
- **Animations**: Smooth transitions and gestures

## 📝 Notes

- **Data Privacy**: All data is stored locally on your device using SQLite
- **No Cloud Sync**: This app does not sync data to any external servers
- **Backup**: Consider backing up your device regularly to prevent data loss

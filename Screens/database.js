import * as SQLite from "expo-sqlite";

// --- GLOBAL DATABASE CONNECTION VARIABLE ---
let db = null;

export const resetDatabase = async () => {
  await connectDb();

  console.log("⚠️ RESETTING DATABASE...");

  await executeSql(`DROP TABLE IF EXISTS bet;`);
  await executeSql(`DROP TABLE IF EXISTS casino_bet;`);
  await executeSql(`DROP TABLE IF EXISTS sport;`);
  await executeSql(`DROP TABLE IF EXISTS house;`);
  await executeSql(`DROP TABLE IF EXISTS game;`);
  await executeSql(`DROP TABLE IF EXISTS sport_budget;`);
  await executeSql(`DROP TABLE IF EXISTS casino_budget;`);

  console.log("🗑️ All tables dropped.");
};

/**
 * 1. ASYNCHRONOUS DATABASE CONNECTION
 */
export const connectDb = async () => {
  if (db) {
    return db; // Return existing connection if available
  }
  try {
    db = await SQLite.openDatabaseAsync("bets.db");
    console.log("Database connected successfully.");
    return db;
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
};

/**
 * 2. PROMISE-BASED SQL EXECUTION HELPER (MODERN ASYNC)
 */
export const executeSql = async (sql, params = []) => {
  if (!db) {
    await connectDb(); // Ensure connection
  }

  const trimmedSql = sql.trim().toUpperCase();

  try {
    // Use .runAsync() for mutations and schema changes
    if (
      trimmedSql.startsWith("CREATE") ||
      trimmedSql.startsWith("INSERT") ||
      trimmedSql.startsWith("UPDATE") ||
      trimmedSql.startsWith("DELETE") ||
      trimmedSql.startsWith("DROP")
    ) {
      await db.runAsync(sql, params);
      return { success: true };
    } else if (trimmedSql.startsWith("SELECT")) {
      // Use .getAllAsync() for SELECT statements (returns rows array directly)
      const rows = await db.getAllAsync(sql, params);
      return rows;
    } else {
      await db.runAsync(sql, params);
      return { success: true };
    }
  } catch (error) {
    // Log the full error to help debug native issues
    console.error(
      `SQL Error: ${error.message} on query: ${sql}`,
      "with params:",
      params
    );
    throw error;
  }
};

// Helper to extract rows array from result object (returns result directly for SELECTs)
const getRows = (result) => result;

/**
 * 3. DATABASE INITIALIZATION AND SEEDING
 */
export const createTables = async () => {
  await connectDb();

  await resetDatabase();

  try {
    // ----- Tables -----
    await executeSql(`
      CREATE TABLE IF NOT EXISTS sport (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sport_name TEXT NOT NULL
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_name TEXT NOT NULL
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS house (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_name TEXT NOT NULL
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS bet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_bet REAL,
        amount_won REAL,
        legs INTEGER NOT NULL,
        sport_id INTEGER NOT NULL,
        house_id INTEGER NOT NULL,
        betted_at TEXT NOT NULL DEFAULT (DATE('now')),
        FOREIGN KEY (sport_id) REFERENCES sport(id),
        FOREIGN KEY (house_id) REFERENCES house(id)
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS casino_bet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_bet REAL,
        amount_won REAL,
        game_id INTEGER NOT NULL,
        house_id INTEGER NOT NULL,
        betted_at TEXT NOT NULL DEFAULT (DATE('now')),
        FOREIGN KEY (game_id) REFERENCES game(id),
        FOREIGN KEY (house_id) REFERENCES house(id)
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS sport_budget (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        balance REAL NOT NULL DEFAULT 0
      );
    `);
    await executeSql(`
      CREATE TABLE IF NOT EXISTS casino_budget (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        balance REAL NOT NULL DEFAULT 0
      );
    `);

    // ----- Indexes -----
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_bets_sport_id ON bet(sport_id);`
    );
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_bets_house_id ON bet(house_id);`
    );
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_bets_betted_at ON bet(betted_at);`
    );
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_casino_bets_game_id ON casino_bet(game_id);`
    );
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_casino_bets_house_id ON casino_bet(house_id);`
    );
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_casino_bets_betted_at ON casino_bet(betted_at);`
    );

    // ----- Trigger: update budget on insert -----
    await executeSql(`
      CREATE TRIGGER IF NOT EXISTS update_budget_after_bet
      AFTER INSERT ON bet
      BEGIN
          UPDATE sport_budget
          SET balance = balance + (NEW.amount_won - NEW.amount_bet)
          WHERE id = 1;
      END;
    `);
    await executeSql(`
      CREATE TRIGGER IF NOT EXISTS update_budget_after_casino_bet
      AFTER INSERT ON casino_bet
      BEGIN
          UPDATE casino_budget
          SET balance = balance + (NEW.amount_won - NEW.amount_bet)
          WHERE id = 1;
      END;
    `);

    // Ensure default budget rows exist
    await executeSql(
      `INSERT OR IGNORE INTO sport_budget (id, balance) VALUES (1, 0);`
    );
    await executeSql(
      `INSERT OR IGNORE INTO casino_budget (id, balance) VALUES (1, 0);`
    );

    // 🚨 INITIAL DUMMY DATA 🚨
    // Initial entities
    await executeSql(
      `INSERT OR IGNORE INTO sport (id, sport_name) VALUES (1, 'Football');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO sport (id, sport_name) VALUES (2, 'Basketball');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO sport (id, sport_name) VALUES (3, 'Tennis');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO house (id, house_name) VALUES (1, 'DraftKings');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO house (id, house_name) VALUES (2, 'BetMGM');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO house (id, house_name) VALUES (3, 'FanDuel');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO game (id, game_name) VALUES (1, 'BlackJack');`
    );
    await executeSql(
      `INSERT OR IGNORE INTO game (id, game_name) VALUES (2, 'Roulette');`
    );

    // --- SAMPLE SPORT BETS ---
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (50.00, 150.00, 3, 1, 1, DATE('now', '-1 day'));`
    ); // WIN
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (100.00, 0.00, 1, 2, 2, DATE('now', '-1 day'));`
    ); // LOSS
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (20.00, 20.00, 2, 1, 3, DATE('now'));`
    ); // PUSH
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (30.00, 90.00, 4, 3, 1, DATE('now', '-2 days'));`
    ); // WIN
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (75.00, 0.00, 1, 1, 1, DATE('now', '-3 days'));`
    ); // LOSS
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (40.00, 80.00, 2, 2, 2, DATE('now'));`
    ); // WIN
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (10.00, 0.00, 1, 3, 3, DATE('now'));`
    ); // LOSS
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (200.00, 1000.00, 5, 1, 1, DATE('now', '-4 days'));`
    ); // WIN
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (5.00, 15.00, 2, 2, 2, DATE('now', '-4 days'));`
    ); // WIN
    await executeSql(
      `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id, betted_at) VALUES (100.00, 0.00, 1, 1, 3, DATE('now', '-5 days'));`
    ); // LOSS

    // --- SAMPLE CASINO BETS ---
    await executeSql(
      `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id, betted_at) VALUES (50.00, 100.00, 1, 1, DATE('now', '-2 days'));`
    ); // WIN
    await executeSql(
      `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id, betted_at) VALUES (10.00, 0.00, 2, 2, DATE('now', '-1 day'));`
    ); // LOSS
    await executeSql(
      `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id, betted_at) VALUES (20.00, 0.00, 1, 1, DATE('now'));`
    ); // LOSS
    await executeSql(
      `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id, betted_at) VALUES (5.00, 50.00, 2, 3, DATE('now', '-3 days'));`
    ); // WIN
    await executeSql(
      `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id, betted_at) VALUES (10.00, 10.00, 1, 2, DATE('now', '-4 days'));`
    ); // PUSH

    console.log(
      "Database tables, indexes, triggers, and comprehensive test data initialized successfully."
    );
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

// ----------------- CRUD FUNCTIONS -----------------
export const insertSport = async (sport_name) => {
  return await executeSql(`INSERT INTO sport (sport_name) VALUES (?);`, [
    sport_name,
  ]);
};
export const insertHouse = async (house_name) => {
  return await executeSql(`INSERT INTO house (house_name) VALUES (?);`, [
    house_name,
  ]);
};
export const insertGame = async (game_name) => {
  return await executeSql(`INSERT INTO game (game_name) VALUES (?);`, [
    game_name,
  ]);
};
export const insertBet = async ({
  amount_bet,
  amount_won,
  legs,
  sport_id,
  house_id,
}) => {
  return await executeSql(
    `INSERT INTO bet (amount_bet, amount_won, legs, sport_id, house_id) VALUES (?, ?, ?, ?, ?);`,
    [amount_bet, amount_won, legs, sport_id, house_id]
  );
};
export const insertCasinoBet = async ({
  amount_bet,
  amount_won,
  game_id,
  house_id,
}) => {
  return await executeSql(
    `INSERT INTO casino_bet (amount_bet, amount_won, game_id, house_id) VALUES (?, ?, ?, ?);`,
    [amount_bet, amount_won, game_id, house_id]
  );
};

// ----------------- READ QUERIES -----------------
export const getAllBets = async () => {
  const result = await executeSql(`SELECT * FROM bet ORDER BY betted_at DESC;`);
  return getRows(result);
};

export const getAllCasinoBets = async () => {
  const result = await executeSql(
    `SELECT * FROM casino_bet ORDER BY betted_at DESC;`
  );
  return getRows(result);
};

export const getAllHouses = async () => {
  const result = await executeSql(`SELECT * FROM house;`);
  return getRows(result);
};

export const getAllSports = async () => {
  const result = await executeSql(`SELECT * FROM sport;`);
  return getRows(result);
};

export const getAllGames = async () => {
  const result = await executeSql(`SELECT * FROM game;`);
  return getRows(result);
};

export const getTotalSportsBalance = async () => {
  const rows = await executeSql(
    `SELECT balance FROM sport_budget WHERE id = 1;`
  );
  return getRows(rows)[0]?.balance || 0;
};

export const getTotalCasinoBalance = async () => {
  const rows = await executeSql(
    `SELECT balance FROM casino_budget WHERE id = 1;`
  );
  return getRows(rows)[0]?.balance || 0;
};

export const getProfitBySport = async (sport_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM bet WHERE sport_id = ?;`,
    [sport_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
};

export const getProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM bet WHERE house_id = ?) +
       (SELECT SUM(amount_won - amount_bet) FROM casino_bet WHERE house_id = ?)
     AS total_profit;`,
    [house_id, house_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
};

export const getSportProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM bet WHERE house_id = ?) AS total_profit;`,
    [house_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
};

export const getCasinoProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM casino_bet WHERE house_id = ?) AS total_profit;`,
    [house_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
};

export const getProfitByGame = async (game_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM casino_bet WHERE game_id = ?;`,
    [game_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
};

export const getProfitBySportAndHouse = async (sport_id, house_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won- amount_bet) AS total_profit FROM bet WHERE sport_id = ? AND house_id = ?;`, [sport_id, house_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
}

export const getProfitByGameAndHouse = async (game_id, house_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won- amount_bet) AS total_profit FROM casino_bet WHERE game_id = ? AND house_id = ?;`, [game_id, house_id]
  );
  return getRows(rows)[0]?.total_profit || 0;
}

export const getTotalSportsRisked = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_bet) AS total_risked FROM bet`
  );
  return rows[0]?.total_risked || 0;
};

export const getTotalCasinoRisked = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_bet) AS total_risked FROM casino_bet`
  );
  return rows[0]?.total_risked || 0;
};


/**
 * NEW FUNCTION FOR STATS SCREEN
 * Returns the count of wins, losses, and pushes for a given type (sport or casino).
 */
export const getBetResultCounts = async (type = "sport") => {
  const table = type === "sport" ? "bet" : "casino_bet";

  const rows = await executeSql(`
        SELECT
            SUM(CASE WHEN amount_won > amount_bet THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN amount_won < amount_bet THEN 1 ELSE 0 END) AS losses,
            SUM(CASE WHEN amount_won = amount_bet AND amount_bet > 0 THEN 1 ELSE 0 END) AS pushes,
            COUNT(id) AS total
        FROM ${table};
    `);

  // Return the single result row
  return rows[0] || { wins: 0, losses: 0, pushes: 0, total: 0 };
};

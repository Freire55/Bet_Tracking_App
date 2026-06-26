import * as SQLite from "expo-sqlite";

let db = null;

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS sport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport_name TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS house (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_name TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS bet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount_bet REAL,
    amount_won REAL,
    legs INTEGER NOT NULL,
    sport_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    betted_at TEXT NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (sport_id) REFERENCES sport(id),
    FOREIGN KEY (house_id) REFERENCES house(id)
  );`,
  `CREATE TABLE IF NOT EXISTS casino_bet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount_bet REAL,
    amount_won REAL,
    game_id INTEGER NOT NULL,
    house_id INTEGER NOT NULL,
    betted_at TEXT NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (game_id) REFERENCES game(id),
    FOREIGN KEY (house_id) REFERENCES house(id)
  );`,
  `CREATE TABLE IF NOT EXISTS sport_budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL NOT NULL DEFAULT 0
  );`,
  `CREATE TABLE IF NOT EXISTS casino_budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL NOT NULL DEFAULT 0
  );`,
];

const INDEX_SQL = [
  `CREATE INDEX IF NOT EXISTS idx_bet_sport_id ON bet(sport_id);`,
  `CREATE INDEX IF NOT EXISTS idx_bet_house_id ON bet(house_id);`,
  `CREATE INDEX IF NOT EXISTS idx_bet_betted_at ON bet(betted_at);`,
  `CREATE INDEX IF NOT EXISTS idx_bet_amount_bet ON bet(amount_bet);`,
  `CREATE INDEX IF NOT EXISTS idx_bet_amount_won ON bet(amount_won);`,
  `CREATE INDEX IF NOT EXISTS idx_casino_bet_game_id ON casino_bet(game_id);`,
  `CREATE INDEX IF NOT EXISTS idx_casino_bet_house_id ON casino_bet(house_id);`,
  `CREATE INDEX IF NOT EXISTS idx_casino_bet_betted_at ON casino_bet(betted_at);`,
  `CREATE INDEX IF NOT EXISTS idx_casino_bet_amount_bet ON casino_bet(amount_bet);`,
  `CREATE INDEX IF NOT EXISTS idx_casino_bet_amount_won ON casino_bet(amount_won);`,
];

const TRIGGER_SQL = [
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_bet
   AFTER INSERT ON bet
   BEGIN
     UPDATE sport_budget
     SET balance = balance + (NEW.amount_won - NEW.amount_bet)
     WHERE id = 1;
   END;`,
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_casino_bet
   AFTER INSERT ON casino_bet
   BEGIN
     UPDATE casino_budget
     SET balance = balance + (NEW.amount_won - NEW.amount_bet)
     WHERE id = 1;
   END;`,
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_bet_delete
   AFTER DELETE ON bet
   BEGIN
     UPDATE sport_budget
     SET balance = balance - (OLD.amount_won - OLD.amount_bet)
     WHERE id = 1;
   END;`,
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_casino_bet_delete
   AFTER DELETE ON casino_bet
   BEGIN
     UPDATE casino_budget
     SET balance = balance - (OLD.amount_won - OLD.amount_bet)
     WHERE id = 1;
   END;`,
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_bet_update
   AFTER UPDATE ON bet
   BEGIN
     UPDATE sport_budget
     SET balance = balance - (OLD.amount_won - OLD.amount_bet) + (NEW.amount_won - NEW.amount_bet)
     WHERE id = 1;
   END;`,
  `CREATE TRIGGER IF NOT EXISTS update_budget_after_casino_bet_update
   AFTER UPDATE ON casino_bet
   BEGIN
     UPDATE casino_budget
     SET balance = balance - (OLD.amount_won - OLD.amount_bet) + (NEW.amount_won - NEW.amount_bet)
     WHERE id = 1;
   END;`,
];

const runAll = async (statements) => {
  for (const statement of statements) {
    await executeSql(statement);
  }
};

export const resetDatabase = async () => {
  await connectDb();

  console.log("Resetting database...");

  await executeSql(`DROP TABLE IF EXISTS bet;`);
  await executeSql(`DROP TABLE IF EXISTS casino_bet;`);
  await executeSql(`DROP TABLE IF EXISTS sport;`);
  await executeSql(`DROP TABLE IF EXISTS house;`);
  await executeSql(`DROP TABLE IF EXISTS game;`);
  await executeSql(`DROP TABLE IF EXISTS sport_budget;`);
  await executeSql(`DROP TABLE IF EXISTS casino_budget;`);

  console.log("All tables dropped.");
};

// DB CONNECT
export const connectDb = async () => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync("bets.db");
    console.log("Database connected.");
    return db;
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    throw error;
  }
};

// SQL RUNNER
export const executeSql = async (sql, params = []) => {
  if (!db) {
    await connectDb();
  }

  const trimmedSql = sql.trim().toUpperCase();
  const isWriteQuery =
    trimmedSql.startsWith("CREATE") ||
    trimmedSql.startsWith("INSERT") ||
    trimmedSql.startsWith("UPDATE") ||
    trimmedSql.startsWith("DELETE") ||
    trimmedSql.startsWith("DROP");

  try {
    if (isWriteQuery) {
      await db.runAsync(sql, params);
      return { success: true };
    }

    if (trimmedSql.startsWith("SELECT")) {
      const rows = await db.getAllAsync(sql, params);
      return rows;
    }

    await db.runAsync(sql, params);
    return { success: true };
  } catch (error) {
    console.error(
      `SQL Error: ${error.message} on query: ${sql}`,
      "with params:",
      params
    );
    throw error;
  }
};

const firstRow = (rows) => rows?.[0] || null;

// INIT
export const createTables = async () => {
  await connectDb();

  try { 
    await runAll(SCHEMA_SQL);
    await runAll(INDEX_SQL);
    await runAll(TRIGGER_SQL);
    await executeSql(`INSERT OR IGNORE INTO sport_budget (id, balance) VALUES (1, 0);`);
    await executeSql(`INSERT OR IGNORE INTO casino_budget (id, balance) VALUES (1, 0);`);

    console.log("Database ready.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

// WRITE
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

export const updateSportBet = async ({
  bet_id,
  amount_bet,
  amount_won,
  legs,
  sport_id,
  house_id,
}) => {
  return await executeSql(
    `
      UPDATE bet
      SET amount_bet = ?, amount_won = ?, legs = ?, sport_id = ?, house_id = ?
      WHERE id = ?;
    `,
    [amount_bet, amount_won, legs, sport_id, house_id, bet_id]
  );
};

export const updateCasinoBet = async ({
  bet_id,
  amount_bet,
  amount_won,
  game_id,
  house_id,
}) => {
  return await executeSql(
    `
      UPDATE casino_bet
      SET amount_bet = ?, amount_won = ?, game_id = ?, house_id = ?
      WHERE id = ?;
    `,
    [amount_bet, amount_won, game_id, house_id, bet_id]
  );
};

export const destroy = async (transaction_id) => {
  await executeSql(`DELETE FROM bet WHERE id = ?`, [transaction_id]);
  return await executeSql(
    `DELETE FROM casino_bet WHERE id = ?`,
    [transaction_id]
  );
};

// READ
export const getAllBets = async () => {
  const result = await executeSql(`SELECT * FROM bet ORDER BY betted_at DESC;`);
  return result;
};

export const getAllCasinoBets = async () => {
  const result = await executeSql(
    `SELECT * FROM casino_bet ORDER BY betted_at DESC;`
  );
  return result;
};

export const getAllHouses = async () => {
  const result = await executeSql(`SELECT * FROM house;`);
  return result;
};

export const getAllSports = async () => {
  const result = await executeSql(`SELECT * FROM sport;`);
  return result;
};

export const getAllGames = async () => {
  const result = await executeSql(`SELECT * FROM game;`);
  return result;
};

export const getTotalSportsBalance = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM bet;`
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getTotalCasinoBalance = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM casino_bet;`
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getProfitBySport = async (sport_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM bet WHERE sport_id = ?;`,
    [sport_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM bet WHERE house_id = ?) +
       (SELECT SUM(amount_won - amount_bet) FROM casino_bet WHERE house_id = ?)
     AS total_profit;`,
    [house_id, house_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getSportProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM bet WHERE house_id = ?) AS total_profit;`,
    [house_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getCasinoProfitByHouse = async (house_id) => {
  const rows = await executeSql(
    `SELECT
       (SELECT SUM(amount_won - amount_bet) FROM casino_bet WHERE house_id = ?) AS total_profit;`,
    [house_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getProfitByGame = async (game_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM casino_bet WHERE game_id = ?;`,
    [game_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getProfitBySportAndHouse = async (sport_id, house_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM bet WHERE sport_id = ? AND house_id = ?;`,
    [sport_id, house_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getProfitByGameAndHouse = async (game_id, house_id) => {
  const rows = await executeSql(
    `SELECT SUM(amount_won - amount_bet) AS total_profit FROM casino_bet WHERE game_id = ? AND house_id = ?;`,
    [game_id, house_id]
  );
  return firstRow(rows)?.total_profit || 0;
};

export const getTotalSportsRisked = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_bet) AS total_risked FROM bet`
  );
  return firstRow(rows)?.total_risked || 0;
};

export const getTotalCasinoRisked = async () => {
  const rows = await executeSql(
    `SELECT SUM(amount_bet) AS total_risked FROM casino_bet`
  );
  return firstRow(rows)?.total_risked || 0;
};

// STATS
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

  return rows[0] || { wins: 0, losses: 0, pushes: 0, total: 0 };
};

export const getCombinedSportsProfit = async () => {
  const result = await executeSql(`
    SELECT 
      sport.sport_name AS sport, 
      house.house_name AS house, 
      SUM(bet.amount_won - bet.amount_bet) AS profit
    FROM bet
    JOIN sport ON bet.sport_id = sport.id
    JOIN house ON bet.house_id = house.id
    GROUP BY sport.id, house.id;
  `);
  return result;
};

export const getCombinedCasinoProfit = async () => {
  const result = await executeSql(`
    SELECT 
      game.game_name AS game, 
      house.house_name AS house, 
      SUM(casino_bet.amount_won - casino_bet.amount_bet) AS profit
    FROM casino_bet
    JOIN game ON casino_bet.game_id = game.id
    JOIN house ON casino_bet.house_id = house.id
    GROUP BY game.id, house.id;
  `);
  return result;
};

export const getBetsWithDetails = async () => {
  const result = await executeSql(`
    SELECT bet.*, sport.sport_name, house.house_name 
    FROM bet 
    JOIN sport ON bet.sport_id = sport.id 
    JOIN house ON bet.house_id = house.id 
    ORDER BY bet.betted_at DESC;
  `);
  return result;
};

export const getCasinoBetsWithDetails = async () => {
  const result = await executeSql(`
    SELECT casino_bet.*, game.game_name, house.house_name 
    FROM casino_bet 
    JOIN game ON casino_bet.game_id = game.id 
    JOIN house ON casino_bet.house_id = house.id 
    ORDER BY casino_bet.betted_at DESC;
  `);
  return result;
};

export const getSportsStatsAggregated = async () => {
  const result = await executeSql(`
    SELECT
      sport.id,
      SUM(bet.amount_won - bet.amount_bet) AS total_profit,
      SUM(CASE WHEN bet.amount_won > bet.amount_bet THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN bet.amount_won < bet.amount_bet THEN 1 ELSE 0 END) AS losses
    FROM sport
    LEFT JOIN bet ON sport.id = bet.sport_id
    GROUP BY sport.id;
  `);
  return result;
};

export const getCasinoStatsAggregated = async () => {
  const result = await executeSql(`
    SELECT
      game.id,
      SUM(casino_bet.amount_won - casino_bet.amount_bet) AS total_profit,
      SUM(CASE WHEN casino_bet.amount_won > casino_bet.amount_bet THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN casino_bet.amount_won < casino_bet.amount_bet THEN 1 ELSE 0 END) AS losses
    FROM game
    LEFT JOIN casino_bet ON game.id = casino_bet.game_id
    GROUP BY game.id;
  `);
  return result;
};

export const getSportsBetTypeAnalysis = async () => {
  const result = await executeSql(`
    SELECT
      CASE WHEN legs = 1 THEN 'Single Bets' ELSE 'Parlays (2+ Legs)' END AS bet_type,
      SUM(amount_won - amount_bet) AS total_profit,
      SUM(CASE WHEN amount_won > amount_bet THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN amount_won < amount_bet THEN 1 ELSE 0 END) AS losses,
      COUNT(id) AS total_bets
    FROM bet
    GROUP BY CASE WHEN legs = 1 THEN 'Single Bets' ELSE 'Parlays (2+ Legs)' END;
  `);
  return result;
};

export const getSportsDailyProfit = async () => {
  const result = await executeSql(`
    SELECT 
      DATE(betted_at) as date, 
      SUM(amount_won - amount_bet) as daily_profit
    FROM bet 
    GROUP BY DATE(betted_at)
    ORDER BY DATE(betted_at) ASC;
  `);
  return result;
};

export const getCasinoDailyProfit = async () => {
  const result = await executeSql(`
    SELECT 
      DATE(betted_at) as date, 
      SUM(amount_won - amount_bet) as daily_profit
    FROM casino_bet 
    GROUP BY DATE(betted_at)
    ORDER BY DATE(betted_at) ASC;
  `);
  return result;
};
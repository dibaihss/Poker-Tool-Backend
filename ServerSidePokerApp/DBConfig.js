const { Pool, Client } = require("pg");

var PGConfig = {
  user: "postgres",
  database: "pokerappdb",
  password: "May5050*#66",
  port: 5432,
  max: 10000,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
};

const pool = new Pool(PGConfig);

module.exports = { pool };
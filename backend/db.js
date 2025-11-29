import mysql from "mysql2/promise";

export const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "screeningschool_db",
  charset: "utf8mb4"
});


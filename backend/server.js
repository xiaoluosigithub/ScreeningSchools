import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("School API is running!");
});

app.get("/schools", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM schools");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "数据库查询失败" });
  }
});

app.get("/schools/province/:province", async (req, res) => {
  try {
    const province = req.params.province;
    const [rows] = await db.query(
      "SELECT * FROM schools WHERE province = ?",
      [province]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "数据库查询失败" });
  }
});

app.get("/schools/city/:city", async (req, res) => {
  try {
    const city = req.params.city;
    const [rows] = await db.query(
      "SELECT * FROM schools WHERE city = ?", 
      [city]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "数据库查询失败" });
  }
});

app.get("/schools/search/:keyword", async (req, res) => {
  try {
    const kw = `%${req.params.keyword}%`;
    const [rows] = await db.query(
      `SELECT * FROM schools  
       WHERE school_name LIKE ? 
          OR city LIKE ? 
          OR province LIKE ?`,
      [kw, kw, kw]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "搜索失败" });
  }
});

app.get("/schools/stats/province", async (req, res) => {
  try {
    const level = (req.query.level || "total").toString().toLowerCase();
    const where = level === "bachelor" ? "WHERE education_level LIKE '%本科%'" : "";
    const [rows] = await db.query(
      `SELECT province AS name, COUNT(*) AS value FROM schools ${where} GROUP BY province`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "统计查询失败" });
  }
});

app.get("/schools/stats/city/:province", async (req, res) => {
  try {
    const level = (req.query.level || "total").toString().toLowerCase();
    const province = req.params.province;
    const whereLevel = level === "bachelor" ? "AND education_level LIKE '%本科%'" : "";
    const [rows] = await db.query(
      `SELECT city AS name, COUNT(*) AS value FROM schools WHERE province = ? ${whereLevel} GROUP BY city`,
      [province]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "统计查询失败" });
  }
});

app.listen(3000, () => {
  console.log("后端已运行：http://localhost:3000");
});


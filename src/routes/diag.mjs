import express from "express";
import axios from "axios";

export const diagRouter = express.Router();

// основний ендпоїнт
diagRouter.get("/egress-ip", async (req, res) => {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
    return res.json({ ip: data?.ip || null });
  } catch (e) {
    console.error("[diag] egress-ip error:", e?.code || e?.message);
    return res.status(500).json({ ip: null, error: e?.message || "failed" });
  }
});

// короткий синонім
diagRouter.get("/", async (req, res) => {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
    return res.json({ ip: data?.ip || null });
  } catch (e) {
    console.error("[diag] ip error:", e?.code || e?.message);
    return res.status(500).json({ ip: null, error: e?.message || "failed" });
  }
});


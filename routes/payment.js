import express from "express";
import axios from "axios";
import Transaction from "../models/Transaction.js";

const router = express.Router();


// ✅ VERIFY PAYMENT (called from frontend)
router.post("/verify", async (req, res) => {
  const { transaction_id } = req.body;

  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const data = response.data;

    if (data.status === "success") {
      const txData = data.data;

      // 🔐 Prevent duplicate save
      const existing = await Transaction.findOne({
        transaction_id: txData.id,
      });

      if (existing) {
        return res.json({ success: true, message: "Already recorded" });
      }

      const newTx = await Transaction.create({
        name: txData.customer.name,
        email: txData.customer.email,
        amount: txData.amount,
        currency: txData.currency,
        status: txData.status,
        transaction_id: txData.id,
        tx_ref: txData.tx_ref,
      });

      return res.json({ success: true, data: newTx });
    }

    res.json({ success: false });
  } catch (error) {
    console.error("Verify Error:", error.message);
    res.status(500).json({ error: "Verification failed" });
  }
});


// 🔔 WEBHOOK (called by Flutterwave automatically)
router.post("/webhook", async (req, res) => {
  const signature = req.headers["verif-hash"];

  // 🔐 Verify request is from Flutterwave
  if (signature !== process.env.FLW_HASH) {
    return res.status(401).end();
  }

  const payload = req.body;

  if (payload.event === "charge.completed") {
    const txData = payload.data;

    try {
      // 🔐 Prevent duplicate save
      const existing = await Transaction.findOne({
        transaction_id: txData.id,
      });

      if (!existing) {
        await Transaction.create({
          name: txData.customer.name,
          email: txData.customer.email,
          amount: txData.amount,
          currency: txData.currency,
          status: txData.status,
          transaction_id: txData.id,
          tx_ref: txData.tx_ref,
        });
      }

      console.log("✅ Webhook Payment Saved");
    } catch (err) {
      console.error("Webhook Error:", err.message);
    }
  }

  res.sendStatus(200);
});

export default router;

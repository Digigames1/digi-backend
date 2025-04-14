const express = require("express");
const app = express();
const orderRouter = require("./routers/order");

app.use(express.json());
app.use("/api/order", orderRouter);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server is live on port ${PORT}`);
});
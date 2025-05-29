const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let bills = []; // In-memory store, replace with DB in prod

// Save bill
app.post("/api/save", (req, res) => {
  const bill = { ...req.body, _id: uuidv4() };
  bills.push(bill);
  res.json({ message: "Bill saved successfully", bill });
});

// Get all bills
app.get("/api/bills", (req, res) => {
  res.json(bills);
});

// Send message (mock)
app.post("/api/send/:id", (req, res) => {
  const { id } = req.params;
  const bill = bills.find((b) => b._id === id);
  if (!bill) return res.status(404).json({ message: "Bill not found" });

  // Here you can integrate SMS/WhatsApp API to send message
  console.log(`Sending message for bill id: ${id}`);

  res.json({ message: "Message sent successfully" });
});

// Delete bill
app.delete("/api/delete/:id", (req, res) => {
  const { id } = req.params;
  const index = bills.findIndex((b) => b._id === id);
  if (index === -1) return res.status(404).json({ message: "Bill not found" });

  bills.splice(index, 1);
  res.json({ message: "Bill deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

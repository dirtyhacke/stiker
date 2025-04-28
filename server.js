const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Added CORS support
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = "your-mongodb-uri";  // <--- Put your MongoDB connection string

// Middlewares
app.use(cors());  // Allow cross-origin requests
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema
const billSchema = new mongoose.Schema({
  amount: String,
  date: String,
  phone: String,
  dueDate: String,
  note: String,
  type: String,
  cmName: String,
  cmNumber: String
});

const Bill = mongoose.model('Bill', billSchema);

// Routes
app.post('/api/save', async (req, res) => {
  try {
    const bill = new Bill(req.body);
    await bill.save();
    res.json({ message: "✅ Bill saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error saving bill" });
  }
});

app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error fetching bills" });
  }
});

app.post('/api/send/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "❌ Bill not found" });
    // Here you would integrate WhatsApp/SMS sending code
    res.json({ message: "✅ Message sent successfully (Mock)" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error sending message" });
  }
});

app.delete('/api/delete/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Bill deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error deleting bill" });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

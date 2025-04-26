const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// MongoDB schema
const BillSchema = new mongoose.Schema({
  amount: String,
  date: String,
  phone: String,
  dueDate: String,
  note: String,
  type: String,
  cmName: String,
  cmNumber: String,
});
const Bill = mongoose.model('Bill', BillSchema);

// Save bill
app.post('/api/save', async (req, res) => {
  try {
    const bill = new Bill(req.body);
    await bill.save();
    res.json({ message: '✅ Bill saved successfully' });
  } catch (error) {
    res.status(500).json({ message: '❌ Error saving bill', error: error.message });
  }
});

// Fetch all bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: '❌ Error fetching bills', error: error.message });
  }
});

// Delete a bill
app.delete('/api/delete/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: '✅ Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: '❌ Error deleting bill', error: error.message });
  }
});

// Send WhatsApp reminder via GreenAPI
const GREEN_ID = process.env.GREENAPI_ID_INSTANCE;
const GREEN_TOKEN = process.env.GREENAPI_API_TOKEN;

app.post('/api/send/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: '❌ Bill not found' });
    }

    const message = `Hello! Reminder from ${bill.cmName} (${bill.cmNumber}) - You owe ₹${bill.amount} for ${bill.type}. Due: ${bill.dueDate}`;

    const response = await axios.post(
      `https://api.green-api.com/waInstance${GREEN_ID}/sendMessage/${GREEN_TOKEN}`,
      {
        chatId: `${bill.phone}@c.us`,
        message
      }
    );

    res.json({ message: '✅ WhatsApp message sent', response: response.data });
  } catch (error) {
    res.status(500).json({ message: '❌ Error sending WhatsApp', error: error.message });
  }
});

// Weekly cron job reminder (Every Monday at 9AM)
cron.schedule('0 9 * * 1', async () => {
  console.log('📅 Running weekly cron job...');
  const today = new Date().toISOString().split('T')[0];

  try {
    const overdueBills = await Bill.find({ dueDate: { $lt: today } });

    for (const bill of overdueBills) {
      const message = `Weekly Reminder: Overdue bill from ${bill.cmName} - ₹${bill.amount} for ${bill.type}, Due: ${bill.dueDate}`;

      await axios.post(
        `https://api.green-api.com/waInstance${GREEN_ID}/sendMessage/${GREEN_TOKEN}`,
        {
          chatId: `${bill.phone}@c.us`,
          message
        }
      );
    }

    console.log('✅ Weekly reminders sent successfully');
  } catch (error) {
    console.error('❌ Error sending weekly reminders:', error.message);
  }
});

// Basic safe route
app.get('/hey', (req, res) => {
  res.send('👋 Hey there! API is working.');
});

// Main route to serve index.html for any other route (updated wildcard route)
app.get('stickercutting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

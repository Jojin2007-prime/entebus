const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// --- ✅ IMPORT COMPLAINT ROUTES ---
const complaintRoutes = require('./routes/complaintRoutes'); 

dotenv.config();
const app = express();

app.use(express.json());

// --- ✅ IMPROVED CORS CONFIGURATION ---
// Allows all origins for better compatibility with mobile/web clients on different hosting services
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ DB Error:', err));

// --- RAZORPAY CONFIG ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Rp42r0Aqd3EZrY', 
  key_secret: process.env.RAZORPAY_KEY_SECRET || '10FbavAMxpgDor4tQk1ARVGc',
});

// --- MODELS ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const busSchema = new mongoose.Schema({
  name: String,
  registrationNumber: String,
  from: String,
  to: String,
  departureTime: String,
  price: Number,
  driverName: String,
  driverContact: String,
});
const Bus = mongoose.model('Bus', busSchema);

const bookingSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  seatNumbers: [Number],
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  bookingDate: { type: Date, default: Date.now },
  travelDate: String,
  paymentId: String,
  orderId: String,
  amount: Number,
  status: { type: String, default: 'Pending' }
});
const Booking = mongoose.model('Booking', bookingSchema);

// --- ROUTES ---

app.use('/api/complaints', complaintRoutes); 

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.json({ message: 'User Registered Successfully!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Email not found' });
    
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });
    
    const token = jwt.sign({ _id: user._id, email: user.email }, 'SECRET_KEY');
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.username === 'admin' && req.body.password === 'admin123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// 2. Bus Management
app.get('/api/buses', async (req, res) => {
  const { from, to } = req.query;
  try {
    const query = {};
    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    const buses = await Bus.find(query);
    res.json(buses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    res.json(bus);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/buses', async (req, res) => {
  try {
    const newBus = new Bus(req.body);
    await newBus.save();
    res.json({ message: 'Bus Added', bus: newBus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/buses/:id', async (req, res) => {
  try {
    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Bus Updated', bus: updatedBus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/buses/:id', async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Booking & Payment Logic

// Step 1: Initialize local booking
app.post('/api/bookings/init', async (req, res) => {
  try {
    const { busId, seatNumbers, customerEmail, customerName, customerPhone, amount, date } = req.body;
    
    const existing = await Booking.find({
      busId,
      travelDate: date,
      status: 'Paid',
      seatNumbers: { $in: seatNumbers }
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: 'One or more seats already booked for this date' });
    }

    const booking = new Booking({
      busId, seatNumbers, customerEmail, customerName, customerPhone, amount, travelDate: date, status: 'Pending'
    });
    await booking.save();
    res.json({ success: true, bookingId: booking._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Step 2: Generate Razorpay Order
app.post('/api/payment/order', async (req, res) => {
  try {
    const options = { 
      amount: Math.round(req.body.amount * 100), // Ensure paise is an integer
      currency: "INR", 
      receipt: "rcp_" + Date.now() 
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Step 3: Verify Razorpay Signature

app.post('/api/bookings/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '10FbavAMxpgDor4tQk1ARVGc';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      booking.paymentId = razorpay_payment_id;
      booking.orderId = razorpay_order_id;
      booking.status = 'Paid';
      await booking.save();
      
      console.log(`✅ Payment Verified for Booking: ${bookingId}`);
      res.json({ success: true, message: 'Success', bookingId: booking._id });
    } else {
      console.error("❌ Signature Mismatch");
      res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
  } catch (err) { 
    console.error("❌ Verification Server Error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// 4. Occupied Seats (Date Specific)
app.get('/api/bookings/occupied', async (req, res) => {
  const { busId, date } = req.query;
  try {
    const bookings = await Booking.find({ busId, travelDate: date, status: 'Paid' });
    const occupiedSeats = bookings.flatMap(b => b.seatNumbers);
    res.json(occupiedSeats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Admin Routes
app.get('/api/admin/manifest', async (req, res) => {
  const { busId, date } = req.query;
  try {
    const query = { busId, status: 'Paid' };
    if (date) query.travelDate = date;

    const bookings = await Booking.find(query).populate('busId').sort({ travelDate: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/history', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const history = await Booking.aggregate([
      { $match: { status: 'Paid', travelDate: { $lt: today } }},
      { $group: {
          _id: { busId: "$busId", date: "$travelDate" },
          totalRevenue: { $sum: "$amount" },
          totalPassengers: { $sum: { $size: "$seatNumbers" } }
      }},
      { $lookup: { from: "buses", localField: "_id.busId", foreignField: "_id", as: "busDetails" }},
      { $unwind: "$busDetails" },
      { $sort: { "_id.date": -1 } }
    ]);

    const formattedHistory = history.map(item => ({
      _id: item._id.busId,
      date: item._id.date,
      bus: item.busDetails,
      revenue: item.totalRevenue,
      passengers: item.totalPassengers
    }));

    res.json(formattedHistory);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('busId').sort({ _id: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Ticket & User History
app.get('/api/verify/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('busId');
    if(!booking) return res.status(404).json({message: "Not Found"});
    res.json(booking);
  } catch (err) { res.status(500).json({ message: 'Invalid Ticket' }); }
});

app.get('/api/bookings/user/:email', async (req, res) => {
  try {
    const bookings = await Booking.find({ customerEmail: req.params.email }).populate('busId').sort({_id:-1});
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

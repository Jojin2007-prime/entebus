const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// 1. Submit a Complaint (User)
router.post('/add', async (req, res) => {
  try {
    const newComplaint = new Complaint(req.body);
    await newComplaint.save();
    res.status(201).json({ message: 'Complaint submitted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// 2. Get All Complaints (Admin)
router.get('/all', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// 3. Update Status (Admin)
router.put('/resolve/:id', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.json({ message: 'Complaint marked as resolved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
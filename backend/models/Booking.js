const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference to the Bus being booked
  busId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bus', 
    required: true 
  },
  // Array of seat numbers selected by the user
  seatNumbers: { 
    type: [Number], 
    required: true 
  },
  // User identification
  customerEmail: { 
    type: String, 
    required: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  // ✅ IMPORTANT: The specific date the passenger is traveling
  // Used by the frontend to check if the 'Retry' option should expire
  travelDate: { 
    type: String, // Stored as 'YYYY-MM-DD' for easy comparison
    required: true 
  },
  // ✅ IMPORTANT: Current state of the booking
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Boarded', 'Cancelled'], 
    default: 'Pending' 
  },
  // Financial details
  amount: { 
    type: Number, 
    required: true 
  },
  // The timestamp of when this record was created
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
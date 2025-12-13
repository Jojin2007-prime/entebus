import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';

export default function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: 12H Time Format
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      axios.get(`https://entebus-api.onrender.com/api/bookings/user/${user.email}`)
        .then(res => {
          setBookings(res.data);
          setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, []);

  const handleRetryPayment = async (booking) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      // 1. Create Order
      const { data: { id: order_id } } = await axios.post('https://entebus-api.onrender.com/api/payment/order', { amount: booking.amount });
      
      // 2. Open Razorpay
      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY",
        amount: booking.amount * 100,
        currency: "INR",
        name: "Ente Bus",
        description: `Retry Booking #${booking._id}`,
        order_id: order_id,
        handler: async function (response) {
          // 3. Verify on Success
          await axios.post('https://entebus-api.onrender.com/api/bookings/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: booking._id
          });
          alert("Payment Successful! Ticket Confirmed.");
          window.location.reload();
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#F59E0B" }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) { alert("Retry Failed. Please try again later."); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">My Trips</h1>
        
        {loading ? (
          <p className="text-center text-gray-500">Loading your journey history...</p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <motion.div 
                key={booking._id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md
                  ${booking.status === 'Paid' ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-100'}`}
              >
                
                {/* Trip Details */}
                <div className="flex-1 w-full text-left">
                  <div className="font-bold text-xl text-indigo-900 mb-2">
                    {booking.busId ? booking.busId.name : 'Bus Details Unavailable'}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-indigo-500"/> 
                      <span className="font-medium">{booking.busId?.from} ➝ {booking.busId?.to}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-orange-500"/> 
                      <span className="font-medium">{booking.travelDate || 'Date N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-green-600"/> 
                      <span className="font-medium">{formatTime(booking.busId?.departureTime)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 font-mono">Booking Ref: {booking._id}</div>
                </div>

                {/* Status & Action */}
                <div className="text-right flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="text-2xl font-black text-gray-800">₹{booking.amount}</div>
                  
                  {booking.status === 'Paid' ? (
                    <div className="flex flex-col items-end">
                       <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                         <CheckCircle size={12} /> CONFIRMED
                       </span>
                       <span className="text-xs text-gray-500 font-bold mt-2">
                         Seats: {booking.seatNumbers.join(', ')}
                       </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 mb-2">
                         <AlertTriangle size={12} /> PENDING
                       </span>
                      <button 
                        onClick={() => handleRetryPayment(booking)} 
                        className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition shadow-lg shadow-gray-200"
                      >
                        <RefreshCw size={14} /> Pay Now
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
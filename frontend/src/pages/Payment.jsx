import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Helper: Check if the travel date has already passed
  const isExpired = (travelDate) => {
    if (!travelDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return travelDate < today;
  };

  useEffect(() => {
    if (!state || !state.bookingId || !state.amount) {
      alert("No active booking found. Redirecting to home...");
      navigate('/');
      return;
    }

    // Block payment if date is in the past
    if (state.date && isExpired(state.date)) {
      alert("This ticket has expired. You cannot pay for a past travel date.");
      navigate('/history');
    }
  }, [state, navigate]);

  const handlePayment = async () => {
    if (isExpired(state.date)) {
      alert("Ticket expired. Please make a new booking.");
      return;
    }

    setLoading(true);
    try {
      const orderUrl = "https://entebus-api.onrender.com/api/payment/order";
      const { data: order } = await axios.post(orderUrl, { amount: state.amount });

      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY", 
        amount: order.amount,
        currency: "INR",
        name: "EnteBus Booking",
        description: "Bus Ticket Reservation",
        order_id: order.id, 
        handler: async function (response) {
          try {
            const verifyUrl = "https://entebus-api.onrender.com/api/bookings/verify";
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: state.bookingId 
            };

            const verifyRes = await axios.post(verifyUrl, verifyData);

            if (verifyRes.data.success) {
              navigate('/booking-success/' + state.bookingId);
            } else {
              alert("Payment Verification Failed!");
            }
          } catch (error) {
            console.error(error);
            alert("Server verification failed.");
          }
        },
        prefill: {
          name: state.customerName || "Passenger", 
          email: state.customerEmail || "user@example.com",
          contact: state.customerPhone || "9999999999"
        },
        theme: { color: "#2563EB" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();
      setLoading(false);

    } catch (error) {
      console.error("Payment Start Error:", error);
      alert("Could not start payment. Please try again.");
      setLoading(false);
    }
  };

  if (!state) return null;

  const ticketExpired = state.date && isExpired(state.date);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${ticketExpired ? 'bg-red-50' : 'bg-blue-50'}`}>
           {ticketExpired ? <AlertCircle size={40} className="text-red-600" /> : <ShieldCheck size={40} className="text-blue-600" />}
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {ticketExpired ? "Ticket Expired" : "Confirm Payment"}
        </h2>
        <p className="text-gray-500 mb-8">{ticketExpired ? "Travel date has passed" : "Secure Checkout"}</p>

        <div className="bg-gray-50 p-6 rounded-xl text-left mb-8 border border-gray-100">
          <div className="flex justify-between mb-3">
             <span className="text-gray-500">Total Amount</span>
             <span className="font-bold text-xl text-gray-900">₹ {state.amount}</span>
          </div>
          <div className="flex justify-between mb-1">
             <span className="text-gray-500 text-sm">Travel Date</span>
             <span className={`font-bold text-sm ${ticketExpired ? 'text-red-500' : 'text-gray-700'}`}>{state.date}</span>
          </div>
        </div>

        {ticketExpired ? (
          <button 
            onClick={() => navigate('/search')}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all"
          >
            Rebook New Ticket
          </button>
        ) : (
          <button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20}/>}
            {loading ? "Processing..." : `Pay ₹${state.amount}`}
          </button>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <Lock size={12}/> Secured by Razorpay
        </div>
      </div>
    </div>
  );
}
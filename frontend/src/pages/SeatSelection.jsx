import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Phone, Calendar, User, Clock } from 'lucide-react';

export default function SeatSelection() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get Date from URL
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get('date');

  const [bus, setBus] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]); 
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const [phone, setPhone] = useState(''); 
  const [passengerName, setPassengerName] = useState('');

  // ✅ Consistent Backend URL
  const API_URL = "https://entebus-api.onrender.com";

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    if (!selectedDate) { 
      alert("No date selected!"); 
      navigate('/'); 
      return; 
    }
    
    // 1. Fetch Bus Details
    axios.get(`${API_URL}/api/buses/${busId}`)
      .then(res => setBus(res.data))
      .catch(err => console.error("Bus fetch error", err));

    // 2. Fetch Occupied Seats for THIS Date
    axios.get(`${API_URL}/api/bookings/occupied?busId=${busId}&date=${selectedDate}`)
      .then(res => setOccupiedSeats(res.data))
      .catch(err => console.error("Error fetching seats", err));
    
    // 3. Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [busId, selectedDate, navigate]);

  const toggleSeat = (num) => {
    if (selectedSeats.includes(num)) setSelectedSeats(selectedSeats.filter(s => s !== num));
    else setSelectedSeats([...selectedSeats, num]);
  };

  const handlePayment = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { alert('Please Login first'); navigate('/login'); return; }
    if (!phone || phone.length < 10) { alert('Enter valid Phone'); return; }
    if (!passengerName) { alert('Enter Passenger Name'); return; }

    const amount = selectedSeats.length * bus.price;

    try {
      // ✅ Logic Fix: Ensure key field names match updated server schema
      const bookingRes = await axios.post(`${API_URL}/api/bookings/init`, {
        busId, 
        seatNumbers: selectedSeats, 
        customerEmail: user.email, 
        customerName: passengerName, 
        customerPhone: phone,
        amount, 
        date: selectedDate // Sent as YYYY-MM-DD
      });
      
      const currentBookingId = bookingRes.data.bookingId;

      const { data: order } = await axios.post(`${API_URL}/api/payment/order`, { amount });

      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY",
        amount: order.amount, 
        currency: "INR", 
        name: "Ente Bus", 
        description: `Booking #${currentBookingId}`, 
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/bookings/verify`, {
              razorpay_order_id: response.razorpay_order_id, 
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature, 
              bookingId: currentBookingId
            });
            navigate(`/booking-success/${currentBookingId}`);
          } catch (e) {
            alert("Payment verification failed. Check My Journeys page.");
          }
        },
        prefill: { name: passengerName, email: user.email, contact: phone },
        theme: { color: "#4F46E5" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) { 
      alert(err.response?.data?.message || "Payment Error"); 
    }
  };

  if (!bus) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white font-black italic uppercase tracking-widest">Loading Seating Map...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 flex justify-center transition-colors duration-300 font-sans">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center h-fit border border-gray-100 dark:border-slate-700 transition-colors">
        
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase italic tracking-tighter">Select Seats</h2>
        
        <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-gray-500 dark:text-slate-400 font-bold flex items-center gap-2 text-lg italic">
               {bus.from} <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {bus.to}
            </p>
            <div className="flex gap-3">
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-black flex items-center gap-1 transition-colors uppercase italic">
                <Calendar size={14}/> {selectedDate}
              </span>
              <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-black flex items-center gap-1 transition-colors uppercase italic">
                <Clock size={14}/> {formatTime(bus.departureTime)}
              </span>
            </div>
        </div>

        {/* SEAT GRID / BUS CHASSIS */}
        <div className="grid grid-cols-4 gap-4 justify-items-center mb-8 max-w-xs mx-auto bg-gray-100 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-slate-700 transition-colors">
          <div className="col-span-4 w-full h-10 bg-gray-300 dark:bg-slate-700 rounded-xl mb-4 text-[10px] flex items-center justify-center text-gray-500 dark:text-slate-400 font-black tracking-[0.3em] transition-colors uppercase italic">DRIVER AREA</div>
          
          {Array.from({ length: 40 }, (_, i) => i + 1).map(seat => {
            const isBooked = occupiedSeats.includes(seat);
            return (
              <button key={seat} disabled={isBooked} onClick={() => toggleSeat(seat)} 
                className={`w-11 h-11 rounded-xl font-black transition-all shadow-sm flex items-center justify-center text-sm
                  ${isBooked 
                    ? 'bg-red-100 text-red-400 dark:bg-red-900/20 dark:text-red-600/50 cursor-not-allowed opacity-50' 
                    : selectedSeats.includes(seat) 
                      ? 'bg-indigo-600 text-white shadow-indigo-300 dark:shadow-indigo-900 shadow-md scale-110' 
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600' 
                  }`}
              >
                {seat}
              </button>
            )
          })}
        </div>

        {/* DETAILS & PAYMENT */}
        <div className="border-t border-dashed border-gray-200 dark:border-slate-700 pt-8 space-y-4">
          
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-left transition-colors">
            <User className="text-gray-400 dark:text-slate-500" size={20} />
            <input 
              placeholder="PASSENGER NAME" 
              className="bg-transparent w-full outline-none font-black text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 uppercase italic" 
              value={passengerName} 
              onChange={(e) => setPassengerName(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-left transition-colors">
            <Phone className="text-gray-400 dark:text-slate-500" size={20} />
            <input 
              type="tel" 
              placeholder="CONTACT NUMBER" 
              className="bg-transparent w-full outline-none font-black text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 uppercase italic" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              maxLength={10} 
            />
          </div>

          <button onClick={handlePayment} disabled={selectedSeats.length === 0} 
            className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase italic flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition active:scale-[0.98] disabled:opacity-30">
            <CreditCard size={20} /> {selectedSeats.length === 0 ? 'Select Seats' : `Pay ₹${selectedSeats.length * bus.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
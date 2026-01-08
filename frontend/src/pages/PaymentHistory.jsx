import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, CheckCircle, RefreshCw, 
  MapPin, AlertTriangle, CreditCard, Download, 
  Ticket, ChevronRight, AlertCircle, Trash2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export default function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // ✅ Consistent Backend URL
  const API_URL = "https://entebus-api.onrender.com";

  // --- ✅ Helper: Precision Date Expiry Logic ---
  const isExpired = (travelDate) => {
    if (!travelDate) return false;
    const now = new Date();
    // Normalize to midnight local time to avoid premature expiry
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [year, month, day] = travelDate.split('-').map(Number);
    const tripMidnight = new Date(year, month - 1, day).getTime();
    return tripMidnight < todayMidnight;
  };

  // --- ✅ UI Handler: Clear Expired Bookings (Local UI filter) ---
  const clearExpiredBookings = () => {
    const activeBookings = bookings.filter(booking => {
      const isPaid = booking.status === 'Paid' || booking.status === 'Boarded';
      const expired = booking.status === 'Pending' && isExpired(booking.travelDate);
      return isPaid || !expired; 
    });
    setBookings(activeBookings);
  };

  // --- ✅ API Handler: Fetch User Bookings ---
  const fetchBookings = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/api/bookings/user/${user.email}`);
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- ✅ API Handler: Razorpay Retry ---
  const handleRetryPayment = async (booking) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const { data: order } = await axios.post(`${API_URL}/api/payment/order`, { 
        amount: booking.amount 
      });
      
      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY", 
        amount: order.amount,
        currency: "INR",
        name: "Ente Bus",
        description: `Booking Payment - ${booking.busId?.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/bookings/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            fetchBookings();
          } catch (error) {
            console.error("Verification Failed");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#4f46e5" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { 
      console.error("Could not initiate payment."); 
    }
  };

  // --- ✅ UI Handler: Ticket PDF Generation ---
  const handleDownload = async (booking) => {
    setDownloadingId(booking._id);
    const doc = new jsPDF();
    const verifierUrl = `https://entebus.vercel.app/verify/${booking._id}`; 
    
    try {
      const qrCodeDataUri = await QRCode.toDataURL(verifierUrl, {
        margin: 1,
        width: 200,
        color: { dark: '#1e1b4b', light: '#ffffff' }
      });

      // PDF Styling
      doc.setFillColor(79, 70, 229); 
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("ENTE BUS", 20, 28);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(16);
      doc.text(booking.busId?.name || "Bus Ticket", 30, 80);
      doc.addImage(qrCodeDataUri, 'PNG', 135, 80, 45, 45);

      doc.save(`EnteBus_Ticket_${booking._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 p-4 md:p-10 pb-28">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3 italic uppercase">
              My Journey <Ticket className="text-indigo-500" size={32} />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">History of your bus bookings</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={clearExpiredBookings}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase italic border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all"
            >
              <Trash2 size={16} /> Clear Expired
            </button>

            <button 
              onClick={fetchBookings}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:rotate-180 transition-all duration-500"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking) => {
                const isPaid = booking.status === 'Paid' || booking.status === 'Boarded';
                const expired = booking.status === 'Pending' && isExpired(booking.travelDate);

                return (
                  <motion.div 
                    layout
                    key={booking._id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, x: -100 }} 
                    className={`group relative overflow-hidden p-6 rounded-[2.5rem] border transition-all duration-300
                      ${isPaid 
                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl' 
                        : expired 
                          ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 grayscale' 
                          : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                            isPaid 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : expired 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                          }`}>
                            {expired ? 'BOOKING EXPIRED' : booking.status}
                          </span>
                        </div>

                        <h2 className={`text-2xl font-black mb-4 transition-colors uppercase italic ${expired ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {booking.busId?.name || 'Bus Unavailable'}
                        </h2>

                        <div className="flex flex-wrap gap-4 text-sm font-bold">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                            <MapPin size={16} className="text-indigo-500" />
                            {booking.busId?.from} → {booking.busId?.to}
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                            <Calendar size={16} className={expired ? "text-red-400" : "text-rose-500"} />
                            {booking.travelDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                          <p className={`text-3xl font-black ${expired ? 'text-gray-400' : 'text-indigo-600 dark:text-indigo-400'}`}>₹{booking.amount}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3 mt-4">
                          {isPaid ? (
                            <>
                              <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-emerald-200 dark:shadow-none italic uppercase">
                                <CheckCircle size={14} /> PAID
                              </div>
                              <button 
                                onClick={() => handleDownload(booking)}
                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase italic hover:underline"
                              >
                                <Download size={14} /> Ticket PDF
                              </button>
                            </>
                          ) : expired ? (
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="bg-gray-200 dark:bg-gray-700 text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black italic flex items-center gap-1.5 border border-gray-300 uppercase"
                            >
                              <AlertCircle size={14} /> NO LONGER PAYABLE
                            </motion.div>
                          ) : (
                            <>
                              <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 uppercase italic">
                                <AlertTriangle size={14} /> PENDING
                              </div>
                              <button 
                                onClick={() => handleRetryPayment(booking)}
                                className="bg-gray-900 dark:bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase italic flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg"
                              >
                                <RefreshCw size={14} /> PAY NOW
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {bookings.length === 0 && !loading && (
              <div className="text-center py-20 opacity-30 font-black uppercase italic text-gray-400">
                No Journey History Found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
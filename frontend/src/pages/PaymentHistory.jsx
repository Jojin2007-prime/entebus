import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, CheckCircle, RefreshCw, 
  MapPin, AlertTriangle, CreditCard, Download, 
  Ticket, ChevronRight, AlertCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export default function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Helper: Date comparison logic
  const isExpired = (travelDate) => {
    const today = new Date().toISOString().split('T')[0];
    return travelDate < today;
  };

  const fetchBookings = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    try {
      setRefreshing(true);
      const res = await axios.get(`https://entebus-api.onrender.com/api/bookings/user/${user.email}`);
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

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const handleRetryPayment = async (booking) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const { data: order } = await axios.post('https://entebus-api.onrender.com/api/payment/order', { 
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
            await axios.post('https://entebus-api.onrender.com/api/bookings/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            fetchBookings();
          } catch (error) {
            alert("Verification Failed. Please contact support.");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#4f46e5" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { 
      alert("Could not initiate payment."); 
    }
  };

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

      doc.setFillColor(79, 70, 229); 
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("ENTE BUS", 20, 28);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL E-TICKET", 20, 36);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.text(`BOOKING ID: ${booking._id.toUpperCase()}`, 20, 55);
      doc.text(`ISSUED ON: ${new Date().toLocaleString()}`, 130, 55);

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, 65, 170, 95, 3, 3);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(booking.busId?.name || "Bus Details", 30, 80);
      
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FROM:", 30, 92);
      doc.text("TO:", 30, 102);
      
      doc.setFont("helvetica", "normal");
      doc.text(booking.busId?.from || "N/A", 50, 92);
      doc.text(booking.busId?.to || "N/A", 50, 102);

      doc.setFont("helvetica", "bold");
      doc.text("TRAVEL DATE:", 30, 115);
      doc.text("TIME:", 30, 125);
      doc.text("SEATS:", 30, 135);

      doc.setFont("helvetica", "normal");
      doc.text(booking.travelDate || "N/A", 70, 115);
      doc.text(formatTime(booking.busId?.departureTime), 70, 125);
      doc.setTextColor(16, 185, 129);
      doc.text(booking.seatNumbers.join(", "), 70, 135);

      doc.addImage(qrCodeDataUri, 'PNG', 135, 80, 45, 45);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("SCAN TO VERIFY", 145, 130);

      doc.setFillColor(249, 250, 251);
      doc.rect(21, 140, 168, 19, 'F');
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.text(`PASSENGER: ${booking.customerName.toUpperCase()}`, 30, 152);
      doc.text(`TOTAL PAID: RS. ${booking.amount}`, 130, 152);

      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text("Model Polytechnic College Mattakkara - Project 2025", 105, 180, { align: 'center' });

      doc.save(`EnteBus_Ticket_${booking._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Error generating PDF ticket.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 p-4 md:p-10 pb-28">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
              My Journey <Ticket className="text-indigo-500" size={32} />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">History of your bus bookings</p>
          </div>
          <button 
            onClick={fetchBookings}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
              <CreditCard size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Bookings Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your future trips will appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking) => {
                const isPaid = booking.status === 'Paid' || booking.status === 'Boarded';
                const expired = booking.status === 'Pending' && isExpired(booking.travelDate); //
                const isDownloading = downloadingId === booking._id;

                return (
                  <motion.div 
                    layout
                    key={booking._id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className={`group relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-300
                      ${isPaid 
                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900' 
                        : expired 
                          ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                          : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                            isPaid 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                              : expired 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' 
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                          }`}>
                            {expired ? 'EXPIRED' : booking.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">#{booking._id.slice(-6).toUpperCase()}</span>
                        </div>

                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {booking.busId?.name || 'Bus Unavailable'}
                        </h2>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                            <MapPin size={16} className="text-indigo-500" />
                            <span className="font-bold">{booking.busId?.from} <ChevronRight size={14} className="inline mx-1"/> {booking.busId?.to}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                            <Calendar size={16} className={expired ? "text-red-500" : "text-rose-500"} />
                            <span className="font-bold">{booking.travelDate}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                            <Clock size={16} className="text-emerald-500" />
                            <span className="font-bold">{formatTime(booking.busId?.departureTime)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fair Amount</p>
                          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹{booking.amount}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3 mt-4">
                          {isPaid ? (
                            <>
                              <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-emerald-200 dark:shadow-none">
                                <CheckCircle size={14} /> PAID
                              </div>
                              <button 
                                onClick={() => handleDownload(booking)}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline ${isDownloading ? 'opacity-50' : ''}`}
                              >
                                {isDownloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                                {isDownloading ? 'Preparing...' : 'Ticket PDF'}
                              </button>
                            </>
                          ) : expired ? (
                            <div className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-red-200 dark:shadow-none">
                              <AlertCircle size={14} /> DATE EXPIRED
                            </div>
                          ) : (
                            <>
                              <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5">
                                <AlertTriangle size={14} /> PENDING
                              </div>
                              <button 
                                onClick={() => handleRetryPayment(booking)}
                                className="bg-gray-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none"
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
          </div>
        )}
      </div>
    </div>
  );
}
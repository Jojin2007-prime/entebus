import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Printer, Bus, Calendar, MapPin, User, Loader, Clock } from 'lucide-react';

export default function BookingSuccess() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
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
    // Fetch Booking Details using the ID from URL
    axios.get(`https://entebus-api.onrender.com/api/verify/${id}`)
      .then(res => {
        setBooking(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching booking:", err);
        setLoading(false);
      });
  }, [id]);

  // --- 🆕 UPDATED PDF DOWNLOAD FUNCTION ---
  const downloadTicket = async () => {
    if (!booking) return;
    const doc = new jsPDF();

    // 1. FETCH QR CODE AS BASE64
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TicketID:${id}`;
    
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;

        // --- DRAW PDF CONTENT ---
        // Blue Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 220, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("EnteBus Ticket", 105, 25, null, null, "center");

        // Bus & Route
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(booking.busId?.name || "Bus Service", 20, 60);
        doc.setFontSize(10);
        doc.text(`${booking.busId?.from} -> ${booking.busId?.to}`, 20, 68);
        doc.text(`Date: ${booking.travelDate}`, 20, 76);

        // 2. ADD THE QR CODE IMAGE TO PDF
        doc.addImage(base64data, 'PNG', 150, 45, 40, 40);
        doc.setFontSize(8);
        doc.text("SCAN TO VERIFY", 170, 88, null, null, "center");

        // Passenger details
        doc.line(20, 95, 190, 95);
        doc.setFontSize(10);
        doc.text(`Passenger: ${booking.customerName}`, 20, 105);
        doc.text(`Mobile: ${booking.customerPhone}`, 120, 105);
        doc.text(`Email: ${booking.customerEmail}`, 20, 112);

        // Seats & ID Box
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 125, 170, 25, 'F');
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text(`Seat(s): ${booking.seatNumbers.join(", ")}`, 30, 142);
        doc.setTextColor(0, 128, 0);
        doc.text(`Paid: Rs. ${booking.amount}`, 120, 142);

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text(`Booking ID: ${booking._id}`, 105, 280, null, null, "center");

        doc.save(`Ticket-${booking._id.slice(-6)}.pdf`);
      };
    } catch (error) {
      console.error("Error generating PDF with QR:", error);
      // Fallback: download without QR if fetch fails
      doc.save(`Ticket-${booking._id.slice(-6)}.pdf`);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
        <p className="text-gray-500 font-bold">Generating your ticket...</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ticket Not Found</h2>
        <p className="text-gray-500">ID: {id}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-bold hover:underline">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center justify-center">
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full border border-gray-100"
      >
        {/* SUCCESS HEADER */}
        <div className="bg-green-500 p-6 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm animate-bounce">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black">Booking Confirmed!</h1>
          <p className="opacity-90 mt-1">Your seat has been reserved.</p>
        </div>

        {/* TICKET DETAILS */}
        <div className="p-6 space-y-6">
          
          {/* QR CODE SECTION */}
          <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TicketID:${id}`} 
               alt="Ticket QR" 
               className="mx-auto mix-blend-multiply mb-3"
             />
             <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Scan to Verify</p>
             <p className="text-xs text-gray-900 font-mono font-bold mt-1">ID: {id.slice(-6).toUpperCase()}</p>
          </div>

          {/* BUS INFO */}
          <div className="space-y-4">
             {/* Bus Name */}
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
               <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Bus size={20}/></div>
               <div>
                 <p className="text-xs text-gray-400 font-bold uppercase">Bus Service</p>
                 <p className="font-bold text-gray-900">{booking.busId?.name}</p>
                 <p className="text-xs text-gray-500 font-mono">{booking.busId?.registrationNumber}</p>
               </div>
             </div>

             {/* Route */}
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
               <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><MapPin size={20}/></div>
               <div>
                 <p className="text-xs text-gray-400 font-bold uppercase">Route</p>
                 <p className="font-bold text-gray-900">{booking.busId?.from} ➝ {booking.busId?.to}</p>
               </div>
             </div>

             {/* Departure Date & Time */}
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
               <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Calendar size={20}/></div>
               <div>
                 <p className="text-xs text-gray-400 font-bold uppercase">Departure</p>
                 <p className="font-bold text-gray-900 flex items-center gap-2">
                   {booking.travelDate} 
                   <span className="text-gray-400 text-sm font-normal">•</span>
                   {formatTime(booking.busId?.departureTime)}
                 </p>
               </div>
             </div>
             
             {/* Passenger & Seats */}
             <div className="flex items-center gap-3">
               <div className="bg-pink-50 p-2 rounded-lg text-pink-600"><User size={20}/></div>
               <div className="w-full">
                 <p className="text-xs text-gray-400 font-bold uppercase">Passenger</p>
                 <p className="font-bold text-gray-900">{booking.customerName || booking.customerEmail}</p>
                 <div className="mt-2 bg-gray-100 p-2 rounded text-center">
                    <span className="text-xs text-gray-500 uppercase font-bold mr-2">Seat Numbers</span>
                    <span className="text-lg font-black text-indigo-600 tracking-widest">{booking.seatNumbers.join(', ')}</span>
                 </div>
               </div>
             </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <button onClick={downloadTicket} className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200">
              <Download size={18} /> Save PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
              <Printer size={18} /> Print
            </button>
          </div>
          
          <button onClick={() => navigate('/')} className="w-full text-gray-400 font-bold text-sm hover:text-indigo-600 transition flex items-center justify-center gap-1">
            <Home size={16} /> Back to Home
          </button>

        </div>
      </motion.div>
    </div>
  );
}
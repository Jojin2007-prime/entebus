import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle, XCircle, Loader, Bus, Calendar, User, Camera, Image as ImageIcon, X, AlertTriangle, MapPin } from 'lucide-react';

export default function TicketVerifier() {
  const [ticketData, setTicketData] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null); // 'valid', 'expired'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper: Format Time
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  // Setup Scanner
  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }
    return () => { if (scannerRef.current) try { scannerRef.current.clear(); } catch (e) {} };
  }, [scanning]);

  const onScanSuccess = (decodedText) => {
    setScanning(false); if (scannerRef.current) try { scannerRef.current.clear(); } catch (e) {}
    verifyTicket(decodedText.replace('TicketID:', '').trim());
  };
  const onScanFailure = (error) => {};

  // --- CORE LOGIC: Verify & Check Date ---
  const verifyTicket = async (id) => {
    setLoading(true); setTicketData(null); setError(''); setTicketStatus(null);
    try {
      const res = await axios.get(`https://entebus-api.onrender.com/api/verify/${id}`);
      const booking = res.data;

      // 📅 CHECK EXPIRY
      const travelDate = new Date(booking.travelDate);
      const today = new Date();
      
      // Reset time to midnight for accurate comparison
      today.setHours(0, 0, 0, 0);
      travelDate.setHours(0, 0, 0, 0);

      if (travelDate < today) {
        setTicketStatus('expired'); // ⚠️ EXPIRED
      } else {
        setTicketStatus('valid');   // ✅ VALID
      }

      setTicketData(booking);
    } catch (err) { 
      setError('❌ Invalid Ticket ID or Ticket Not Found'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true); setError(''); setTicketData(null); setScanning(false);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) { setLoading(false); setError("Could not read QR code."); }
  };

  // --- RESET FUNCTION ---
  const resetScanner = () => {
    setTicketData(null);
    setTicketStatus(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><QrCode className="text-indigo-500" /> Ticket Scanner</h2>

      {/* 1. INITIAL BUTTONS */}
      {!scanning && !ticketData && !loading && !error && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button onClick={() => {resetScanner(); setScanning(true);}} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/50"><Camera size={28} /> Scan with Camera</button>
          <div className="flex items-center gap-4 py-2"><div className="h-px bg-gray-700 flex-1"></div><span className="text-gray-500 text-sm font-bold uppercase">OR</span><div className="h-px bg-gray-700 flex-1"></div></div>
          <button onClick={() => fileInputRef.current.click()} className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border border-gray-700"><ImageIcon size={28} /> Upload QR Image</button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>
      )}

      {/* 2. SCANNER VIEW */}
      <div id="reader" className={scanning ? "w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-500 mb-6" : "hidden"}></div>
      {scanning && <div className="w-full max-w-sm text-center"><p className="text-sm font-bold text-gray-400 mb-4 animate-pulse">Scanning...</p><button onClick={() => setScanning(false)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><X size={20} /> Stop Scanning</button></div>}
      
      {/* 3. LOADING */}
      {loading && <div className="text-center p-8 bg-gray-800 rounded-xl mb-4 border border-gray-700 w-full max-w-sm"><Loader className="animate-spin mx-auto mb-4 text-indigo-500" size={40} /><p className="text-lg font-bold">Verifying Ticket...</p></div>}
      
      {/* 4. ERROR (Invalid ID) */}
      {error && <div className="w-full max-w-md p-6 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex flex-col items-center gap-4 text-center"><XCircle size={48} /><span className="font-bold text-xl">{error}</span><button onClick={resetScanner} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold hover:bg-red-500 transition">Try Again</button></div>}

      {/* 5. RESULT: EXPIRED TICKET ⚠️ */}
      {ticketData && ticketStatus === 'expired' && (
        <div className="w-full max-w-md bg-white text-gray-900 rounded-xl overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
          <div className="bg-orange-500 p-6 text-white text-center font-bold flex flex-col items-center justify-center gap-2">
            <AlertTriangle size={48} className="animate-bounce" />
            <span className="text-2xl">TICKET EXPIRED</span>
            <span className="text-sm font-normal opacity-90">This trip date has passed.</span>
          </div>
          <div className="p-6 space-y-4 opacity-50"> {/* Grayed out content */}
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3"><div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={20} /></div><div><p className="text-xs text-gray-500 uppercase font-bold">Passenger</p><p className="font-bold text-lg">{ticketData.customerName}</p></div></div>
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3"><div className="bg-gray-100 p-2 rounded-full text-gray-600"><Calendar size={20} /></div><div><p className="text-xs text-gray-500 uppercase font-bold">Expired Date</p><p className="font-bold text-lg text-red-500">{ticketData.travelDate}</p></div></div>
             <button onClick={resetScanner} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-gray-800 transition"><QrCode size={18} /> Scan Next</button>
          </div>
        </div>
      )}

      {/* 6. RESULT: VALID TICKET ✅ */}
      {ticketData && ticketStatus === 'valid' && (
        <div className="w-full max-w-md bg-white text-gray-900 rounded-xl overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
          <div className="bg-green-500 p-4 text-white text-center font-bold flex items-center justify-center gap-2 text-lg"><CheckCircle size={24} /> VERIFIED VALID</div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3"><div className="bg-indigo-50 p-2 rounded-full text-indigo-600"><User size={20} /></div><div><p className="text-xs text-gray-500 uppercase font-bold">Passenger</p><p className="font-bold text-lg">{ticketData.customerName || ticketData.customerEmail}</p></div></div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3"><div className="bg-orange-50 p-2 rounded-full text-orange-600"><Bus size={20} /></div><div><p className="text-xs text-gray-500 uppercase font-bold">Route</p><p className="font-bold text-lg">{ticketData.busId?.name}</p><p className="text-sm text-gray-600">{ticketData.busId?.from} ➝ {ticketData.busId?.to}</p></div></div>
            <div className="flex items-center gap-3"><div className="bg-blue-50 p-2 rounded-full text-blue-600"><Calendar size={20} /></div><div><p className="text-xs text-gray-500 uppercase font-bold">Departure</p><p className="font-bold text-lg">{ticketData.travelDate} at {formatTime(ticketData.busId?.departureTime)}</p></div></div>
            <div className="bg-gray-100 p-4 rounded-xl text-center mt-4"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Assigned Seats</p><p className="text-3xl font-black text-indigo-600 tracking-widest">{ticketData.seatNumbers.join(', ')}</p></div>
            <button onClick={resetScanner} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-gray-800 transition"><QrCode size={18} /> Verify Another Ticket</button>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bus, Clock, CreditCard, Star, CheckCircle, QrCode 
} from 'lucide-react';

// --- ASSETS IMPORT ---
import busImage from '../assets/bus.png';

export default function Landing() {
  const navigate = useNavigate();

  const handleBookTicket = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    user ? navigate('/search') : navigate('/login');
  };

  const handleScanTicket = () => {
    navigate('/verify');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* ================= HERO SECTION ================= */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white overflow-hidden">
        
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 py-16 md:py-32 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="md:w-1/2 space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-indigo-100 text-sm font-bold backdrop-blur-sm">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              Rated #1 Bus Booking App in Kerala
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Journey with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Confidence.</span>
            </h1>
            
            <p className="text-xl text-indigo-100 leading-relaxed max-w-lg">
              Experience the smoothest travel across God's Own Country. 
              Real-time seat selection, secure payments, and instant tickets.
            </p>

            {/* BUTTON ALIGNMENT LOGIC */}
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleBookTicket} 
                className="w-full sm:w-auto bg-yellow-400 text-indigo-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-yellow-300 hover:scale-105 transition shadow-xl flex items-center justify-center gap-2"
              >
                <Bus size={24} />
                Book Ticket Now
              </button>

              {/* MOBILE-ONLY SCAN BUTTON */}
              <button
                onClick={handleScanTicket}
                className="w-full sm:hidden bg-indigo-600 px-8 py-4 rounded-xl font-black text-lg hover:bg-indigo-500 transition shadow-xl flex items-center justify-center gap-2"
              >
                <QrCode size={22} />
                Scan Ticket
              </button>
            </div>
          </motion.div>

          {/* Right Image/Illustration */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="md:w-1/2 relative"
          >
            <div className="bg-gradient-to-b from-white/10 to-transparent p-8 rounded-[3rem] border border-white/10 backdrop-blur-sm relative">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl absolute -top-6 -left-6 z-20 flex items-center gap-3"
              >
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Status</p>
                  <p className="text-gray-900 dark:text-white font-bold">Verified</p>
                </div>
              </motion.div>

              <img 
                src={busImage} 
                alt="Luxury Bus" 
                className="rounded-3xl shadow-2xl w-full object-cover h-[400px]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <div className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Why Book With Us?</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">We simplify your travel experience with cutting-edge technology and customer-first service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700 group">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition">
                <Star size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium Service</h3>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Board instantly with our digital ticketing system. The highest rated fleet in the state.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700 group">
              <div className="w-16 h-16 bg-pink-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 group-hover:scale-110 transition">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">On-Time Guarantee</h3>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">We value your time. Our buses depart and arrive strictly according to the schedule.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700 group">
              <div className="w-16 h-16 bg-green-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 group-hover:scale-110 transition">
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure Payments</h3>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">Pay with UPI, Cards, or Netbanking. Your transactions are 100% safe.</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="bg-gray-900 dark:bg-slate-950 py-16 text-center text-white border-t border-gray-800 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Join thousands of happy travelers today.</p>
          <button 
            onClick={handleBookTicket} 
            className="bg-indigo-600 px-10 py-4 rounded-full font-bold hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            Book Your Seat Now
          </button>
        </div>
      </div>
    </div>
  );
}
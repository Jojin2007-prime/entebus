import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Instagram, MapPin, Globe, ShieldCheck, Users, Clock, ArrowRight, Facebook, Twitter } from 'lucide-react';

export default function AboutUs() {
  
  // ANIMATION VARIANTS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    // Update 1: Main background
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      {/* Update 2: Hero Section (Kept mostly same, added dark border at bottom) */}
      <div className="bg-indigo-900 dark:bg-slate-950 text-white py-20 px-6 text-center border-b border-indigo-800 dark:border-slate-800 transition-colors">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-4xl md:text-5xl font-black mb-4"
        >
          Connecting Kerala, <span className="text-yellow-400">One Journey at a Time.</span>
        </motion.h1>
        <p className="text-indigo-200 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          We are Kerala's most trusted online bus booking platform, dedicated to making travel simple, secure, and accessible for everyone.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 -mt-10">
        
        {/* CONTACT CARDS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          
          {/* 1. CALL US */}
          <motion.a 
            variants={itemVariants}
            href="tel:+919876543210" 
            // Update 3: Card Styling
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Call Support</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">24/7 Customer Service</p>
            <span className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-1 group-hover:underline">
              +91 98765 43210 <ArrowRight size={16}/>
            </span>
          </motion.a>

          {/* 2. EMAIL US */}
          <motion.a 
            variants={itemVariants}
            href="mailto:support@keralabus.com" 
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Email Us</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">For queries & feedback</p>
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-1 group-hover:underline">
              support@entebus.com <ArrowRight size={16}/>
            </span>
          </motion.a>

          {/* 3. INSTAGRAM */}
          <motion.a 
            variants={itemVariants}
            href="https://instagram.com/_ente_bus_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Instagram size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Follow Us</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">See latest updates & offers</p>
            <span className="text-pink-600 dark:text-pink-400 font-bold flex items-center justify-center gap-1 group-hover:underline">
              @_ente_bus_ <ArrowRight size={16}/>
            </span>
          </motion.a>

        </motion.div>

        {/* MISSION SECTION */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <div className="md:w-1/2">
             {/* Using Unsplash URL to prevent 'file not found' build errors */}
             <img 
               src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1000&auto=format&fit=crop" 
               alt="Kerala Bus Journey" 
               className="rounded-3xl shadow-2xl w-full object-cover h-[400px]"
             />
          </div>
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Why Choose Us?</h2>
            <p className="text-gray-600 dark:text-slate-300 text-lg leading-relaxed">
              We started with a simple mission: to revolutionize bus travel in Kerala. 
              Gone are the days of standing in long queues. With KeralaBus, your seat is just a click away.
            </p>
            
            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg text-indigo-600 dark:text-indigo-400"><ShieldCheck size={24}/></div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">100% Secure Payments</h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400">We use top-tier encryption for safe transactions.</p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg text-orange-600 dark:text-orange-400"><Clock size={24}/></div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">On-Time Guarantee</h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Strict schedules to ensure you reach on time.</p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400"><Users size={24}/></div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">24/7 Support</h4>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Our team is always ready to assist you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOCATION FOOTER */}
        {/* Update 4: Footer Styling */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-200 dark:border-slate-700 text-center transition-colors">
          <h3 className="text-xl font-bold mb-6 flex items-center justify-center gap-2 text-gray-900 dark:text-white">
            <MapPin className="text-red-500" /> Visit Our Headquarters
          </h3>
          <p className="text-gray-600 dark:text-slate-300 max-w-lg mx-auto mb-6">
            EnteBus Pvt Ltd, <br/>
            MPTC Mattakkara, Kottayam, Kerala - 686001
          </p>
          <div className="flex justify-center gap-4">
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"><Globe size={24}/></a>
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"><Facebook size={24}/></a>
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-sky-500 dark:hover:text-sky-400 transition"><Twitter size={24}/></a>
          </div>
        </div>

      </div>
    </div>
  );
}
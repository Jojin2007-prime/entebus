import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Tag, Clock } from 'lucide-react';

export default function TicketPrices() {
  const [buses, setBuses] = useState([]);
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
    // Fetches ALL buses because we send no query params
    axios.get('https://entebus-api.onrender.com/api/buses')
      .then(res => {
        setBuses(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Current Ticket Prices</h1>
          <p className="text-gray-500">Transparent pricing for all our active routes.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading rates...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus, index) => (
              <motion.div 
                key={bus._id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg">
                    <Tag size={20} />
                  </div>
                  <span className="text-3xl font-black text-gray-900">₹{bus.price}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">{bus.name}</h3>
                
                <div className="flex items-center gap-2 text-gray-500 font-medium mb-4">
                  {bus.from} <ArrowRight size={16} /> {bus.to}
                </div>
                
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Daily Departure</span>
                  <div className="flex items-center gap-1 font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded">
                     <Clock size={14} className="text-orange-500"/>
                     {formatTime(bus.departureTime)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';

export default function BusResults() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState({}); 

  const location = useLocation();
  const navigate = useNavigate();

  // Helper for 12h Time
  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get(`https://entebus-api.onrender.com/api/buses${location.search}`);
        setBuses(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchBuses();
  }, [location.search]);

  const handleDateChange = (busId, dateValue) => setSelectedDates(prev => ({ ...prev, [busId]: dateValue }));

  const proceedToSeatSelection = (busId) => {
    const date = selectedDates[busId];
    if (!date) { alert("Please select a travel date first."); return; }
    navigate(`/seats/${busId}?date=${date}`);
  };

  return (
    // Update 1: Main background
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-6">Available Routes</h2>
        
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Searching...</p>
        ) : buses.length === 0 ? (
          <p className="text-center dark:text-gray-300">No buses found.</p>
        ) : (
          <div className="grid gap-6">
            {buses.map((bus, index) => (
              <motion.div 
                key={bus._id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                // Update 2: Card styling (Slate-800 for card background)
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all"
              >
                
                <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
                  {/* Bus Name */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{bus.name}</h3>
                  
                  {/* Route Info */}
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-3">
                    <span className="font-bold text-lg">{bus.from}</span> 
                    <ArrowRight size={18} className="text-gray-400 dark:text-gray-500" /> 
                    <span className="font-bold text-lg">{bus.to}</span>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                     <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded transition-colors">
                        <Clock size={14} className="text-orange-500" /> 
                        Departs: <span className="text-gray-900 dark:text-white font-bold ml-1">{formatTime(bus.departureTime)}</span>
                     </div>
                  </div>
                </div>

                <div className="text-right w-full md:w-auto flex flex-col items-end">
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Price per seat</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400 mb-4">₹{bus.price}</p>
                  
                  <div className="flex flex-col items-end gap-2 w-full mb-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Travel Date</label>
                    <input 
                        type="date" 
                        min={new Date().toISOString().split("T")[0]} 
                        // Update 3: Input Field Styling
                        className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 p-2 rounded-lg text-sm font-bold text-gray-700 dark:text-white outline-none w-full md:w-48 text-right transition-colors dark:color-scheme-dark"
                        onChange={(e) => handleDateChange(bus._id, e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => proceedToSeatSelection(bus._id)} 
                    disabled={!selectedDates[bus._id]} 
                    // Update 4: Button Styling (Primary Indigo for Dark Mode, Black for Light)
                    className={`px-8 py-3 rounded-xl font-bold transition w-full md:w-auto 
                      ${selectedDates[bus._id] 
                        ? 'bg-black dark:bg-indigo-600 text-white hover:bg-gray-800 dark:hover:bg-indigo-500' 
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    {selectedDates[bus._id] ? 'Select Seats' : 'Pick Date'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
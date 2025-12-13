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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-gray-800 mb-6">Available Routes</h2>
        
        {loading ? <p className="text-center text-gray-500">Searching...</p> : buses.length === 0 ? <p className="text-center">No buses found.</p> : (
          <div className="grid gap-6">
            {buses.map((bus, index) => (
              <motion.div key={bus._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} 
                className="bg-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center border border-gray-100 hover:shadow-xl transition-all">
                
                <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{bus.name}</h3>
                  <div className="flex items-center gap-4 text-gray-600 mb-3">
                    <span className="font-bold text-lg">{bus.from}</span> <ArrowRight size={18} className="text-gray-400" /> <span className="font-bold text-lg">{bus.to}</span>
                  </div>
                  <div className="flex gap-6 text-sm text-gray-500">
                     <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Clock size={14} className="text-orange-500" /> Departs: <span className="text-gray-900 font-bold ml-1">{formatTime(bus.departureTime)}</span>
                     </div>
                  </div>
                </div>

                <div className="text-right w-full md:w-auto flex flex-col items-end">
                  <p className="text-sm text-gray-400 mb-1">Price per seat</p>
                  <p className="text-3xl font-black text-green-600 mb-4">₹{bus.price}</p>
                  
                  <div className="flex flex-col items-end gap-2 w-full mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">Travel Date</label>
                    <input type="date" min={new Date().toISOString().split("T")[0]} 
                        className="bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm font-bold text-gray-700 outline-none w-full md:w-48 text-right"
                        onChange={(e) => handleDateChange(bus._id, e.target.value)}
                    />
                  </div>

                  <button onClick={() => proceedToSeatSelection(bus._id)} disabled={!selectedDates[bus._id]} 
                    className={`px-8 py-3 rounded-xl font-bold transition w-full md:w-auto ${selectedDates[bus._id] ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
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
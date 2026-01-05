import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, MapPin, Bus, Phone, User, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BusSchedule() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authentication Check: Get user and admin status
  const user = JSON.parse(localStorage.getItem('user'));
  const admin = localStorage.getItem('admin');
  const isLoggedIn = !!(user || admin);

  // Helper: 12H Time Format
  const formatTime = (time24) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    axios.get('https://entebus-api.onrender.com/api/buses')
      .then(res => {
        setBuses(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 flex justify-center items-center gap-3 transition-colors">
            <Bus className="text-indigo-600 dark:text-indigo-400" size={40} /> Bus Schedule
          </h1>
          <p className="text-gray-500 dark:text-slate-400 transition-colors">View fleet details and daily departure times.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 dark:text-slate-500">Loading schedule...</p>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
              
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-gray-100 dark:bg-slate-950 p-4 font-bold text-gray-500 dark:text-slate-400 uppercase text-sm transition-colors">
                <div>Bus Details</div>
                <div>Route</div>
                <div>Departure Time</div>
                <div>Driver Info</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {buses.map((bus, index) => (
                  <motion.div 
                    key={bus._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: index * 0.05 }} 
                    className="grid grid-cols-1 md:grid-cols-4 p-4 items-center gap-4 md:gap-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Col 1: Bus Name & Reg */}
                    <div>
                      <div className="font-bold text-lg text-indigo-900 dark:text-indigo-400">{bus.name}</div>
                      <div className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded mt-1 border border-gray-200 dark:border-slate-600 transition-colors">
                        <FileText size={10} /> {bus.registrationNumber || 'N/A'}
                      </div>
                    </div>

                    {/* Col 2: Route */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 font-medium">
                      <MapPin size={16} className="text-gray-400 dark:text-slate-500" />
                      {bus.from} ➝ {bus.to}
                    </div>

                    {/* Col 3: Departure Time */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                        <Clock size={18} className="text-orange-500" /> 
                        {formatTime(bus.departureTime)}
                      </div>
                    </div>

                    {/* Col 4: Conditional Driver Info */}
                    <div className="transition-colors">
                      {isLoggedIn ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/30">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-200">
                            <User size={14} className="text-indigo-500 dark:text-indigo-400"/> {bus.driverName || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <Phone size={12}/> {bus.driverContact || '--'}
                          </div>
                        </div>
                      ) : (
                        <Link to="/login-options" className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-slate-900/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg group hover:border-indigo-400 transition-all">
                          <Lock size={14} className="text-gray-400 group-hover:text-indigo-500" />
                          <span className="text-[10px] uppercase tracking-tighter font-bold text-gray-400 group-hover:text-indigo-500 mt-1">
                            Login to view
                          </span>
                        </Link>
                      )}
                    </div>

                  </motion.div>
                ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
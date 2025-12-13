import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, MapPin, Bus, Phone, User, FileText } from 'lucide-react';

export default function BusSchedule() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4 flex justify-center items-center gap-3">
            <Bus className="text-indigo-600" size={40} /> Bus Schedule
          </h1>
          <p className="text-gray-500">View fleet details and daily departure times.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading schedule...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             
             {/* Table Header */}
             <div className="grid grid-cols-4 bg-gray-100 p-4 font-bold text-gray-500 uppercase text-sm">
               <div>Bus Details</div>
               <div>Route</div>
               <div>Departure Time</div>
               <div>Driver Info</div>
             </div>

             {/* Table Body */}
             <div className="divide-y divide-gray-100">
               {buses.map((bus, index) => (
                 <motion.div 
                   key={bus._id} 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   transition={{ delay: index * 0.05 }} 
                   className="grid grid-cols-1 md:grid-cols-4 p-4 items-center gap-4 md:gap-0 hover:bg-gray-50 transition"
                 >
                   {/* Col 1: Bus Name & Reg */}
                   <div>
                     <div className="font-bold text-lg text-indigo-900">{bus.name}</div>
                     <div className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 border border-gray-200">
                       <FileText size={10} /> {bus.registrationNumber || 'N/A'}
                     </div>
                   </div>

                   {/* Col 2: Route */}
                   <div className="flex items-center gap-2 text-gray-600 font-medium">
                     <MapPin size={16} className="text-gray-400" />
                     {bus.from} ➝ {bus.to}
                   </div>

                   {/* Col 3: Departure Time (Date Removed) */}
                   <div>
                     <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
                       <Clock size={18} className="text-orange-500" /> 
                       {formatTime(bus.departureTime)}
                     </div>
                   </div>

                   {/* Col 4: Driver */}
                   <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                       <User size={14} className="text-indigo-500"/> {bus.driverName || 'N/A'}
                     </div>
                     <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                       <Phone size={12}/> {bus.driverContact || '--'}
                     </div>
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
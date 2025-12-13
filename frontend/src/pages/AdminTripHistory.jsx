import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar } from 'lucide-react';

const AdminTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // This fetches the "smart" history from the backend route we added earlier
    axios.get('https://entebus-api.onrender.com/api/admin/history')
      .then(res => setTrips(res.data))
      .catch(err => console.error(err));
  }, []);

  // This is the specific "Connection" function
  const handleViewManifest = (busId, date) => {
    navigate(`/admin/manifest?busId=${busId}&date=${date}`);
  };

  return (
    // Update 1: Main Background
    <div className="p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/admin')} 
          // Update 2: Back Button styling
          className="p-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trip History</h1>
      </div>

      {/* Table Container */}
      {/* Update 3: Card Background and Border */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          {/* Table Head */}
          <thead className="bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Bus Name</th>
              <th className="p-4">Route</th>
              <th className="p-4">Revenue</th>
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {trips.map((trip, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                <td className="p-4 font-bold text-gray-700 dark:text-white">{trip.date}</td>
                <td className="p-4 text-gray-900 dark:text-gray-300">{trip.bus?.name}</td>
                <td className="p-4 text-sm text-gray-500 dark:text-slate-400">{trip.bus?.from} ➝ {trip.bus?.to}</td>
                <td className="p-4 text-green-600 dark:text-green-400 font-bold">₹{trip.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {trips.length === 0 && (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500">
            No past trips found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTripHistory;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';

const AdminTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Consistent Backend URL
  const API_URL = "https://entebus-api.onrender.com";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/admin/history`);
        setTrips(res.data);
      } catch (err) {
        console.error("History Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ✅ Matches the updated logic in BusManifest.jsx
  const handleViewManifest = (busId, date) => {
    navigate(`/admin/manifest?busId=${busId}&date=${date}`);
  };

  return (
    <div className="p-4 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300 font-sans">
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/admin')} 
            className="p-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase italic tracking-tighter">Trip History</h1>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader className="animate-spin text-indigo-500" size={32} />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Loading Records...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                <thead className="bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Bus Service</th>
                    <th className="p-5">Route Map</th>
                    <th className="p-5">Revenue</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {trips.map((trip, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition cursor-pointer group"
                      onClick={() => handleViewManifest(trip.bus?._id || trip._id, trip.date)}
                    >
                      <td className="p-5 font-black text-gray-700 dark:text-white whitespace-nowrap italic">
                        {trip.date}
                      </td>
                      <td className="p-5 text-gray-900 dark:text-gray-300 font-bold group-hover:text-indigo-600 transition uppercase">
                        {trip.bus?.name || 'Unknown Bus'}
                      </td>
                      <td className="p-5 text-xs text-gray-500 dark:text-slate-400 font-bold">
                        <div className="flex items-center gap-2">
                          <span>{trip.bus?.from}</span>
                          <span className="text-indigo-500">➝</span>
                          <span>{trip.bus?.to}</span>
                        </div>
                      </td>
                      <td className="p-5 text-green-600 dark:text-green-400 font-black text-lg whitespace-nowrap italic">
                        ₹{trip.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Empty State */}
          {!loading && trips.length === 0 && (
            <div className="p-20 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800">
              <p className="font-black uppercase italic tracking-widest opacity-30 text-xs">No historical trip data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTripHistory;
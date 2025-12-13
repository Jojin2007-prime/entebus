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
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white rounded shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Trip History</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Bus Name</th>
              <th className="p-4">Route</th>
              <th className="p-4">Revenue</th>
              
            </tr>
          </thead>
          <tbody>
            {trips.map((trip, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-700">{trip.date}</td>
                <td className="p-4">{trip.bus?.name}</td>
                <td className="p-4 text-sm text-gray-500">{trip.bus?.from} ➝ {trip.bus?.to}</td>
                <td className="p-4 text-green-600 font-bold">₹{trip.revenue}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="p-8 text-center text-gray-400">No past trips found.</div>}
      </div>
    </div>
  );
};

export default AdminTripHistory;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminHistory.css'; // We will create this next

const AdminHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // 1. Fetch the History Data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('https://entebus-api.onrender.com/api/admin/history');
        setTrips(res.data); // The data structure matches our new backend
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch history", err);
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // 2. Format Date (e.g., "2025-12-10" -> "10 Dec, 2025")
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // 3. Search Filter
  const filteredTrips = trips.filter(trip => 
    trip.bus?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.bus?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Handle "View Manifest" Click
  // We need BOTH Bus ID and Date to find the right passenger list
  const handleViewManifest = (busId, date) => {
    // Navigate to a URL like: /admin/manifest?busId=123&date=2025-10-10
    navigate(`/admin/manifest?busId=${busId}&date=${date}`);
  };

  if (loading) return <div className="loading-container">Loading Trip History...</div>;

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>📜 Past Trip History</h2>
        <input 
          type="text" 
          placeholder="Search by Bus Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>

      <div className="table-card">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bus Details</th>
              <th>Passengers</th>
              <th>Total Revenue</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip, index) => (
                <tr key={index}>
                  <td className="date-cell">{formatDate(trip.date)}</td>
                  <td>
                    <div className="bus-info">
                      <span className="bus-name">{trip.bus?.name}</span>
                      <span className="bus-reg">{trip.bus?.registrationNumber}</span>
                    </div>
                  </td>
                  <td className="center-text">👥 {trip.passengers}</td>
                  <td className="revenue-text">₹ {trip.revenue}</td>
                  <td>
                    <button 
                      className="manifest-btn"
                      onClick={() => handleViewManifest(trip._id, trip.date)}
                    >
                      View Manifest
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No past trips found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminHistory;
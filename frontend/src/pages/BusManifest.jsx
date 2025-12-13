import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext'; 
import { Users, ArrowLeft, Phone, User, CheckCircle, FileText, Calendar, Filter, Clock, ArrowUpDown, MapPin } from 'lucide-react';

export default function BusManifest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = tryUseToast(); 

  // --- STATE MANAGEMENT ---
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [filterDate, setFilterDate] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'time', 'route'

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        // A. Fetch All Buses for the Grid
        const busRes = await axios.get('https://entebus-api.onrender.com/api/buses');
        setBuses(busRes.data);
        setLoading(false);

        // B. Check URL for Deep Links (Coming from History Page?)
        const urlBusId = searchParams.get('busId');
        const urlDate = searchParams.get('date');

        if (urlBusId) {
          const targetBus = busRes.data.find(b => b._id === urlBusId);
          if (targetBus) {
             handleViewManifest(targetBus, urlDate);
          } else {
             // Fallback if bus isn't in the main list yet
             const specificBusRes = await axios.get(`https://entebus-api.onrender.com/api/buses/${urlBusId}`);
             handleViewManifest(specificBusRes.data, urlDate);
          }
        }
      } catch (err) {
        console.error("Init Error:", err);
        setLoading(false);
      }
    };
    init();
  }, [searchParams]);

  // --- 2. SORTING LOGIC ---
  const getSortedBuses = () => {
    return [...buses].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'route') return a.from.localeCompare(b.from);
      if (sortBy === 'time') return a.departureTime.localeCompare(b.departureTime);
      return 0;
    });
  };

  // --- 3. FETCH DATA ---
  const fetchManifest = async (busId, date = '') => {
    try {
      const queryDate = date || filterDate; 
      // This allows fetching ALL history if date is empty, or filtering if date exists
      const url = `https://entebus-api.onrender.com/api/admin/manifest?busId=${busId}&date=${queryDate}`;
      
      const res = await axios.get(url);
      setPassengers(res.data);
    } catch (err) {
      console.error(err);
      if(toast) toast.error('Error fetching passenger list');
    }
  };

  // --- 4. EVENT HANDLERS ---
  
  // Open Detail View
  const handleViewManifest = (bus, dateOverride = '') => {
    setSelectedBus(bus);
    const dateToUse = dateOverride || ''; 
    setFilterDate(dateToUse);
    fetchManifest(bus._id, dateToUse);
  };

  // Change Date Filter
  const handleDateFilterChange = (e) => {
    const newDate = e.target.value;
    setFilterDate(newDate);
    if (selectedBus) {
      fetchManifest(selectedBus._id, newDate);
    }
  };

  // Go Back
  const handleBack = () => {
    // If we came from the History page via URL, back button should go back to History
    if (searchParams.get('busId')) {
      navigate('/admin/history');
    } else {
      setSelectedBus(null);
      setPassengers([]);
      setFilterDate('');
    }
  };

  // --- HELPERS ---
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; 
    return `${h12}:${minute} ${ampm}`;
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack} 
            className="p-2 bg-white rounded-lg hover:bg-gray-100 shadow-sm transition border border-gray-200"
          >
            <ArrowLeft size={20} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="text-blue-700"/> 
              {selectedBus ? 'Passenger Manifest' : 'Select Bus Route'}
            </h1>
            <p className="text-sm text-gray-500">
              {selectedBus ? `Viewing details for ${selectedBus.name}` : 'Manage and view passenger lists'}
            </p>
          </div>
        </div>

        {/* Sorting Controls (Only on Grid View) */}
        {!selectedBus && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <ArrowUpDown size={16} className="text-gray-400"/>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sort By:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer text-sm"
            >
              <option value="name">Bus Name</option>
              <option value="time">Departure Time</option>
              <option value="route">Route Origin</option>
            </select>
          </div>
        )}
      </div>

      {selectedBus ? (
        // ==========================
        // VIEW 1: BUS DETAIL / LIST
        // ==========================
        <div className="max-w-6xl mx-auto animate-fade-in">
          
          {/* 1. Info Card & Filter */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{selectedBus.name}</h2>
              <div className="flex flex-wrap gap-3 text-blue-100 text-sm font-bold">
                 <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                   <FileText size={12}/> {selectedBus.registrationNumber}
                 </span>
                 <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                   <MapPin size={12}/> {selectedBus.from} ➝ {selectedBus.to}
                 </span>
                 <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                   <Clock size={12}/> {formatTime(selectedBus.departureTime)}
                 </span>
              </div>
            </div>
            
            {/* Date Picker */}
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-3 shadow-inner">
               <div className="p-2 bg-white/20 rounded-lg"><Filter size={20} className="text-white"/></div>
               <div className="flex flex-col">
                 <label className="text-[10px] uppercase font-bold text-blue-200 tracking-wider mb-1">Filter by Date</label>
                 <input 
                   type="date" 
                   value={filterDate} 
                   onChange={handleDateFilterChange} 
                   className="bg-transparent text-white font-bold text-lg outline-none [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                 />
               </div>
            </div>
          </div>

          {/* 2. Passenger Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="font-bold text-gray-700 flex items-center gap-2">
                <Users size={18} className="text-gray-400"/> Passenger List
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {passengers.length} Bookings Found
              </span>
            </div>
            
            {passengers.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Calendar size={40} className="text-gray-300"/>
                </div>
                <h3 className="text-lg font-bold text-gray-600">No passengers found</h3>
                <p className="text-sm">
                  {filterDate ? `No bookings for ${filterDate}` : 'Select a date or wait for new bookings.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-500 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-gray-200">Seat</th>
                      <th className="p-4 border-b border-gray-200">Passenger</th>
                      <th className="p-4 border-b border-gray-200">Journey Date</th>
                      <th className="p-4 border-b border-gray-200">Contact</th>
                      <th className="p-4 border-b border-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {passengers.map((p) => (
                      <tr key={p._id} className="hover:bg-blue-50/50 transition duration-150">
                        <td className="p-4">
                          <div className="flex gap-1 flex-wrap max-w-[120px]">
                            {p.seatNumbers.map(s => (
                              <span key={s} className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs shadow-sm shadow-blue-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 text-base">{p.customerName || 'Guest User'}</div>
                          <div className="text-xs text-gray-400 mt-1">ID: {p._id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-2 font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                            <Calendar size={14} className="text-orange-500"/>
                            {p.travelDate}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500">
                           <div className="flex flex-col gap-1 text-sm">
                             <span className="flex items-center gap-2"><Phone size={12} className="text-gray-400"/> {p.customerPhone}</span>
                             <span className="flex items-center gap-2"><User size={12} className="text-gray-400"/> {p.customerEmail}</span>
                           </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                            <CheckCircle size={14}/> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ==========================
        // VIEW 2: BUS GRID LIST
        // ==========================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {loading ? (
             <div className="col-span-3 text-center py-20 text-gray-400">Loading Fleet Data...</div>
          ) : getSortedBuses().map(bus => (
            <div 
              key={bus._id} 
              className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer relative overflow-hidden" 
              onClick={() => handleViewManifest(bus)}
            >
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:h-1.5 transition-all"></div>

              <div className="flex justify-between items-start mb-5 mt-2">
                <div>
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition">{bus.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono border border-gray-200">
                        {bus.registrationNumber || 'No Reg'}
                      </span>
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Clock size={14} /> {formatTime(bus.departureTime)}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-3 mb-6 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><MapPin size={12}/> Route</span> 
                    <span className="text-gray-900 font-bold">{bus.from} ➝ {bus.to}</span>
                  </div>
              </div>

              <button className="w-full bg-gray-50 text-gray-700 group-hover:bg-blue-600 group-hover:text-white py-3 rounded-xl font-bold text-sm transition-colors duration-200 flex justify-center items-center gap-2">
                <FileText size={16} /> Select & View Manifest
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Safety check for Toast context
function tryUseToast() {
  try { return useToast(); } catch(e) { return null; }
}
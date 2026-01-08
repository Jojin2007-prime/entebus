import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext'; 
import { Users, ArrowLeft, Phone, User, CheckCircle, FileText, Calendar, Filter, Clock, ArrowUpDown, MapPin, Printer } from 'lucide-react';

export default function BusManifest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast(); 

  // --- STATE MANAGEMENT ---
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [filterDate, setFilterDate] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name'); 

  const API_URL = "https://entebus-api.onrender.com";

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        const busRes = await axios.get(`${API_URL}/api/buses`);
        setBuses(busRes.data);
        setLoading(false);

        // Check for Deep Links (Coming from History Page)
        const urlBusId = searchParams.get('busId');
        const urlDate = searchParams.get('date');

        if (urlBusId) {
          const targetBus = busRes.data.find(b => b._id === urlBusId);
          if (targetBus) {
            handleViewManifest(targetBus, urlDate);
          } else {
            // Fallback for specific bus fetch
            const specificBusRes = await axios.get(`${API_URL}/api/buses/${urlBusId}`);
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

  // --- 3. FETCH DATA (FIXED LOGIC) ---
  const fetchManifest = async (busId, date = '') => {
    try {
      // Logic Fix: Ensure parameters are passed correctly to the backend
      const queryDate = date || filterDate; 
      const res = await axios.get(`${API_URL}/api/admin/manifest`, {
        params: { busId, date: queryDate }
      });
      
      setPassengers(res.data);
      if (res.data.length > 0) {
        showToast(`Loaded ${res.data.length} bookings`, "success");
      } else if (queryDate) {
        showToast("No passengers found for this date", "info");
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to manifest server', 'error');
    }
  };

  // --- 4. EVENT HANDLERS ---
  const handleViewManifest = (bus, dateOverride = '') => {
    setSelectedBus(bus);
    const dateToUse = dateOverride || ''; 
    setFilterDate(dateToUse);
    fetchManifest(bus._id, dateToUse);
  };

  const handleDateFilterChange = (e) => {
    const newDate = e.target.value;
    setFilterDate(newDate);
    if (selectedBus) {
      fetchManifest(selectedBus._id, newDate);
    }
  };

  const handleBack = () => {
    if (searchParams.get('busId')) {
      navigate('/admin/history');
    } else {
      setSelectedBus(null);
      setPassengers([]);
      setFilterDate('');
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12; 
    return `${h12}:${minute} ${ampm}`;
  };

  const processedManifest = passengers.flatMap(booking =>
    booking.seatNumbers.map(seat => ({
      seat,
      name: booking.customerName || "Guest",
      phone: booking.customerPhone || "N/A",
      email: booking.customerEmail || "N/A",
      status: booking.status,
      date: booking.travelDate
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10 transition-colors font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 hover:bg-gray-100 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300"/>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
              {selectedBus ? 'Trip Manifest' : 'Select Route'}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Passenger Management</p>
          </div>
        </div>

        {!selectedBus && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border dark:border-slate-700 shadow-sm">
            <span className="text-[10px] font-black text-gray-500 uppercase">Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent font-bold text-xs dark:text-white outline-none cursor-pointer">
              <option value="name">Bus Name</option>
              <option value="time">Time</option>
              <option value="route">Route</option>
            </select>
          </div>
        )}
      </div>

      {selectedBus ? (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* BUS INFO CARD */}
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Users size={120}/></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black italic uppercase mb-2 tracking-tighter">{selectedBus.name}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic border border-white/10">{selectedBus.from} → {selectedBus.to}</span>
                <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic border border-white/10">{formatTime(selectedBus.departureTime)}</span>
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl border border-white/20 backdrop-blur-md relative z-10 min-w-[200px]">
              <label className="text-[9px] font-black uppercase block mb-1 tracking-widest opacity-60">Journey Date</label>
              <input type="date" value={filterDate} onChange={handleDateFilterChange} className="bg-transparent font-black text-lg outline-none invert cursor-pointer w-full" />
            </div>
          </div>

          {/* PASSENGER TABLE */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
                  <tr className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="p-6">Seat</th>
                    <th className="p-6">Passenger Details</th>
                    <th className="p-6">Contact Info</th>
                    <th className="p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {processedManifest.length > 0 ? processedManifest.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition duration-300">
                      <td className="p-6 font-black text-xl text-indigo-600 italic">#{p.seat}</td>
                      <td className="p-6 font-black dark:text-white uppercase text-sm italic">{p.name}</td>
                      <td className="p-6">
                        <p className="text-xs font-bold dark:text-gray-300">{p.phone}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{p.email}</p>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic border ${
                          p.status === 'Boarded' 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <Users size={64} className="mb-4"/>
                          <p className="font-black uppercase italic tracking-widest">No Manifest Data</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {processedManifest.length > 0 && (
              <div className="p-8 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-700 flex justify-end">
                <button onClick={() => window.print()} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase italic flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                  <Printer size={16}/> Download Passenger List
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BUS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {getSortedBuses().map(bus => (
            <div key={bus._id} onClick={() => handleViewManifest(bus)} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 hover:shadow-2xl transition-all cursor-pointer group hover:-translate-y-1">
              <h3 className="font-black text-2xl dark:text-white group-hover:text-indigo-600 transition uppercase italic tracking-tighter">{bus.name}</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6">{bus.registrationNumber || 'No ID'}</p>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900 p-5 rounded-[1.5rem] border dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Route</span>
                  <span className="text-xs font-black dark:text-gray-300 italic">{bus.from} → {bus.to}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Time</span>
                  <span className="text-indigo-600 font-black text-xs italic">{formatTime(bus.departureTime)}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-indigo-500 uppercase italic">Tap to view manifest →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '' });
  const [locations, setLocations] = useState({ from: [], to: [] }); // Data from DB
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "https://entebus-api.onrender.com";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/');

    // ✅ NEW: Fetch unique locations from your database
    const fetchLocations = async () => {
      try {
        setLoading(true);
        // We fetch all buses to extract unique starting points and destinations
        const res = await axios.get(`${API_URL}/api/buses`);
        const allBuses = res.data;

        // Extract unique 'from' and 'to' values
        const uniqueFrom = [...new Set(allBuses.map(bus => bus.from))].sort();
        const uniqueTo = [...new Set(allBuses.map(bus => bus.to))].sort();

        setLocations({ from: uniqueFrom, to: uniqueTo });
      } catch (err) {
        console.error("Error loading locations from database:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setSearch({ ...search, [field]: value });
    if (value.length > 0) {
      // Filter based on the dynamically fetched locations
      const filtered = locations[field].filter(loc => 
        loc.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions({ ...suggestions, [field]: filtered });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const selectSuggestion = (field, value) => {
    setSearch({ ...search, [field]: value });
    setSuggestions({ ...suggestions, [field]: [] });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.from || !search.to) return alert("Please select a valid route");
    navigate(`/results?from=${search.from}&to=${search.to}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="font-black italic uppercase tracking-tighter text-indigo-500">Syncing Route Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[500px] border border-transparent dark:border-slate-700"
      >
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
            Find Your <br/><span className="text-indigo-600 dark:text-indigo-400">Route.</span>
          </h1>
          <p className="text-gray-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-4 mb-8">
            Live Database Search
          </p>

          <form onSubmit={handleSearch} className="space-y-6">
            {/* FROM INPUT */}
            <div className="relative">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-500 transition-all">
                <MapPin className="text-indigo-500" />
                <input 
                  type="text" 
                  placeholder="Origin" 
                  className="bg-transparent w-full outline-none font-black italic uppercase tracking-tighter text-gray-900 dark:text-white placeholder-gray-400" 
                  value={search.from}
                  onChange={e => handleInputChange('from', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
              {suggestions.from.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl mt-2 max-h-40 overflow-y-auto overflow-hidden">
                  {suggestions.from.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('from', loc)}
                      className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-700 dark:text-gray-200 font-black italic uppercase tracking-tighter border-b last:border-0 dark:border-slate-700 transition-colors"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* TO INPUT */}
            <div className="relative">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-500 transition-all">
                <Navigation className="text-orange-500" />
                <input 
                  type="text" 
                  placeholder="Destination" 
                  className="bg-transparent w-full outline-none font-black italic uppercase tracking-tighter text-gray-900 dark:text-white placeholder-gray-400" 
                  value={search.to}
                  onChange={e => handleInputChange('to', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
               {suggestions.to.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl mt-2 max-h-40 overflow-y-auto overflow-hidden">
                  {suggestions.to.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('to', loc)}
                      className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-700 dark:text-gray-200 font-black italic uppercase tracking-tighter border-b last:border-0 dark:border-slate-700 transition-colors"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black italic uppercase tracking-tighter text-xl flex justify-center items-center gap-3 hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 active:scale-95">
              <Search size={24} /> Search Buses
            </button>
          </form>
        </div>

        <div className="md:w-1/2 bg-indigo-900 dark:bg-slate-950 p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4 relative z-10">Live Route Sync</h3>
             <p className="text-indigo-200 dark:text-slate-400 font-bold relative z-10">We now fetch routes directly from our fleet database. If a bus exists, you'll find it here.</p>
        </div>
      </motion.div>
    </div>
  );
}
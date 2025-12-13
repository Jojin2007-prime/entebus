import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Kerala Districts & Major Cities for Autocomplete
const KERALA_LOCATIONS = [
  "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", 
  "Idukki", "Ernakulam", "Kochi", "Thrissur", "Palakkad", 
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasargod",
  "Bangalore", "Chennai", "Coimbatore"
];

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '' });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/');
  }, []);

  // Handle Autocomplete Typing
  const handleInputChange = (field, value) => {
    setSearch({ ...search, [field]: value });
    if (value.length > 0) {
      const filtered = KERALA_LOCATIONS.filter(loc => 
        loc.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions({ ...suggestions, [field]: filtered });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const selectSuggestion = (field, value) => {
    setSearch({ ...search, [field]: value });
    setSuggestions({ ...suggestions, [field]: [] }); // Hide dropdown
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate without date. Date is selected on the next page.
    navigate(`/buses?from=${search.from}&to=${search.to}`);
  };

  return (
    // Update 1: Main background transition
    <div className="min-h-[90vh] bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        // Update 2: Card background turns dark slate
        className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[500px] transition-colors duration-300"
      >
        
        {/* Left Side: Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {/* Update 3: Text colors */}
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 transition-colors">Find Your <br/><span className="text-indigo-600 dark:text-indigo-400">Route.</span></h1>
          <p className="text-gray-500 dark:text-slate-400 mb-8 mt-2 transition-colors">Search for active bus routes across Kerala.</p>

          <form onSubmit={handleSearch} className="space-y-6">
            
            {/* FROM INPUT */}
            <div className="relative">
              {/* Update 4: Input container background and border */}
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all">
                <MapPin className="text-indigo-500 dark:text-indigo-400" />
                <input 
                  type="text" 
                  placeholder="From (e.g. Ernakulam)" 
                  // Update 5: Input text color and placeholder
                  className="bg-transparent w-full outline-none font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-slate-500" 
                  value={search.from}
                  onChange={e => handleInputChange('from', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
              {/* Dropdown List */}
              {suggestions.from.length > 0 && (
                // Update 6: Dropdown background and text
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-lg rounded-xl mt-2 max-h-40 overflow-y-auto">
                  {suggestions.from.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('from', loc)}
                      // Update 7: Hover state for dropdown items
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer text-gray-700 dark:text-gray-200 font-medium border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* TO INPUT */}
            <div className="relative">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-100 dark:ring-indigo-900 transition-all">
                <Navigation className="text-orange-500 dark:text-orange-400" />
                <input 
                  type="text" 
                  placeholder="To (e.g. Bangalore)" 
                  className="bg-transparent w-full outline-none font-medium text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-slate-500" 
                  value={search.to}
                  onChange={e => handleInputChange('to', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
               {/* Dropdown List */}
               {suggestions.to.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-lg rounded-xl mt-2 max-h-40 overflow-y-auto">
                  {suggestions.to.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('to', loc)}
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer text-gray-700 dark:text-gray-200 font-medium border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">
              <Search size={20} /> Find Buses
            </button>
          </form>
        </div>

        {/* Right Side: Decorative */}
        {/* Update 8: Changed indigo-900 to slate-900/indigo-950 for a darker look in dark mode, or kept similar as it's already dark */}
        <div className="md:w-1/2 bg-indigo-900 dark:bg-slate-950 p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden transition-colors duration-300">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/2"></div>
             <h3 className="text-3xl font-bold mb-4 relative z-10">Smart Booking</h3>
             <p className="text-indigo-200 dark:text-slate-400 relative z-10">Select your route first, then choose your travel date. We make daily commuting easier.</p>
        </div>

      </motion.div>
    </div>
  );
}
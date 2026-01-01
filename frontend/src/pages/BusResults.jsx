import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bus,
  ArrowLeft,
  Clock,
  IndianRupee,
  Loader,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BusResults() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get('from');
  const to = queryParams.get('to');
  const date = queryParams.get('date');

  useEffect(() => {
    const fetchBuses = async () => {
      if (!from || !to) {
        setError('Missing route information. Please restart your search.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `https://entebus-api.onrender.com/api/buses?from=${from}&to=${to}`
        );
        setBuses(res.data);
      } catch (err) {
        console.error('API Fetch Error:', err);
        setError('Unable to connect to the fleet database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center">
        <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-indigo-500 font-medium animate-pulse">
          Scanning buses…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10 transition-colors duration-300 pb-20">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/search')}
              className="p-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Available Buses
              </h1>

              {from && to && (
                <div className="flex items-center gap-2 mt-2 text-sm text-indigo-500 font-semibold">
                  <span>{from}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                  <span>{to}</span>
                  <span className="ml-3 text-gray-400 dark:text-slate-500 text-xs font-medium">
                    | {date || 'Today'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center mb-10">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={44} />
            <p className="text-red-500 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 text-indigo-500 font-semibold underline text-sm"
            >
              Go back
            </button>
          </div>
        )}

        {/* BUS LIST */}
        <div className="grid gap-8">
          <AnimatePresence>
            {!error && buses.length > 0 ? (
              buses.map((bus, index) => (
                <motion.div
                  key={bus._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-gray-50 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center transition-all"
                >
                  <div className="text-center md:text-left">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                      Verified Service
                    </span>

                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-3">
                      {bus.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-3 text-gray-500 dark:text-slate-400 text-sm justify-center md:justify-start">
                      <Clock size={16} className="text-emerald-500" />
                      Departs at {bus.departureTime}
                    </div>
                  </div>

                  <div className="text-center md:text-right mt-8 md:mt-0 md:pl-12 md:border-l border-gray-100 dark:border-slate-700">
                    <p className="text-xs text-gray-400 font-medium mb-1">
                      Fare
                    </p>

                    <div className="flex items-center gap-1 text-4xl font-bold text-gray-900 dark:text-white mb-6 justify-center md:justify-end">
                      <IndianRupee size={28} className="text-green-600" />
                      {bus.price}
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/seats/${bus._id}?date=${date}`)
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 px-10 py-4 rounded-2xl text-white font-semibold text-lg shadow-lg active:scale-95 transition-all"
                    >
                      Select Seats
                    </button>
                  </div>
                </motion.div>
              ))
            ) : !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700"
              >
                <Bus
                  size={64}
                  className="mx-auto text-slate-300 dark:text-slate-700 mb-6 opacity-20"
                />
                <h2 className="text-2xl font-semibold text-gray-500">
                  No buses found
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Try a different route or date
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

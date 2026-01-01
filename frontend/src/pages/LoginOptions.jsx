import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';
import BusLogo from '../components/BusLogo';

export default function LoginOptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex justify-center mb-4 scale-110">
           <BusLogo />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
          Ente<span className="text-indigo-600 dark:text-indigo-400">Bus</span> Gateway
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">Choose your login type</p>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-500">
        
        {/* TRAVELER CARD */}
        <div 
          onClick={() => navigate('/login')} 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-[3rem] text-center cursor-pointer hover:border-indigo-500 hover:ring-4 ring-indigo-500/10 transition-all group shadow-xl"
        >
          <div className="bg-indigo-100 dark:bg-indigo-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <User size={48} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 uppercase italic">Traveler</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Book your bus seats and manage tickets</p>
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-sm">
            Continue <ArrowRight size={18} />
          </div>
        </div>

        {/* OFFICIAL/ADMIN CARD */}
        <div 
          onClick={() => navigate('/admin-login')} 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-[3rem] text-center cursor-pointer hover:border-red-500 hover:ring-4 ring-red-500/10 transition-all group shadow-xl"
        >
          <div className="bg-red-100 dark:bg-red-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck size={48} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 uppercase italic">Official</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Manage fleet and verify boarding tickets</p>
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-black uppercase tracking-widest text-sm">
            Admin Panel <ArrowRight size={18} />
          </div>
        </div>

      </div>

      <button onClick={() => navigate('/')} className="mt-12 text-slate-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest transition-colors">
        ← Back to Home
      </button>
    </div>
  );
}
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, ScanLine, History, Calendar, Home, 
  LayoutDashboard, Search, IndianRupee, Info, ChevronRight, 
  Sun, Moon, MessageSquareWarning 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BusLogo from './BusLogo'; 

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { theme, toggleTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem('user'));
  const admin = localStorage.getItem('admin'); 

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin'); 
    navigate('/');
    window.location.reload();
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
          ${isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400' 
          }`}
      >
        <Icon size={18} className={isActive ? "text-white" : "text-gray-400 dark:text-gray-500"} /> 
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* --- LOGO SECTION --- */}
          <Link to="/" className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1 scale-90 md:scale-100">
               <BusLogo />
            </div>
            <span className="text-indigo-600 dark:text-indigo-400">
                Ente<span className="text-yellow-400">Bus</span>
            </span>
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex flex-wrap justify-center gap-2">
            <NavItem to="/" icon={Home} label="Home" />
            {user && <NavItem to="/search" icon={Search} label="Search" />}
            <NavItem to="/schedule" icon={Calendar} label="Schedule" />
            <NavItem to="/prices" icon={IndianRupee} label="Prices" />

            {user && !admin && (
              <Link 
                to="/complaint" 
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
              >
                <MessageSquareWarning size={18} /> Support
              </Link>
            )}

            <NavItem to="/about" icon={Info} label="About" />
          </div>

          {/* --- ACTIONS SECTION --- */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all mr-1"
            >
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user && !admin && (
                <Link to="/verify" className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all mr-2 ${location.pathname === '/verify' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-gray-700 hover:bg-indigo-100 dark:hover:bg-gray-700'}`}>
                  <ScanLine size={18} /> <span>Scan Ticket</span>
                </Link>
              )}

              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

              {admin ? (
                <div className="flex items-center gap-2">
                  <Link to="/admin" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase leading-none">Welcome</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.name.split(' ')[0]}</p>
                  </div>
                  <Link to="/history" className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition">
                    <History size={20} />
                  </Link>
                  <button onClick={handleLogout} className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-xl transition">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* ✅ UPDATED: Single Login Action for Gateway */}
                  <Link 
                    to="/login-options" 
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-tighter shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Login / Join <ChevronRight size={16}/>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Action */}
            <div className="md:hidden flex items-center gap-2">
              {(user || admin) ? (
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl active:scale-95 transition-transform"
                >
                  <LogOut size={20} />
                </button>
              ) : (
                <Link to="/login-options" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-transform">
                  Login
                </Link>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </nav>
  );
}
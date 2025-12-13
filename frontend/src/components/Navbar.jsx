import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bus, User, LogOut, ScanLine, History, Calendar, Home, 
  LayoutDashboard, Search, IndianRupee, Info, ChevronRight, 
  Sun, Moon // Added Sun and Moon icons
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Import the theme hook

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { theme, toggleTheme } = useTheme(); // Get theme logic

  // Get user data
  const user = JSON.parse(localStorage.getItem('user'));
  const admin = localStorage.getItem('admin'); 

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin'); 
    navigate('/');
    window.location.reload();
  };

  // Nav Item Component with Dark Mode support
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
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* 1. LOGO */}
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-400 text-white p-2 rounded-xl shadow-md">
                <Bus size={26} />
              </div>
              <span className="text-indigo-600 dark:text-indigo-400">
                    Ente
                 <span className="text-yellow-400">Bus</span>
              </span>
            </Link>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
               {/* Mobile Dark Toggle */}
               <button onClick={toggleTheme} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                  {theme === 'dark' ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
               </button>

               {user ? (
                 <button onClick={handleLogout} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"><LogOut size={20}/></button>
               ) : (
                 <Link to="/login" className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold">Login</Link>
               )}
            </div>
          </div>

          {/* 2. MAIN NAVIGATION */}
          <div className="flex flex-wrap justify-center gap-2">
            <NavItem to="/" icon={Home} label="Home" />
            
            {user && (
              <NavItem to="/search" icon={Search} label="Search" />
            )}

            <NavItem to="/schedule" icon={Calendar} label="Schedule" />
            <NavItem to="/prices" icon={IndianRupee} label="Prices" />
            <NavItem to="/about" icon={Info} label="About" />
          </div>

          {/* 3. RIGHT SIDE: AUTH, SCANNER & TOGGLE */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Dark Mode Toggle (Desktop) */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all mr-1"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
            </button>

            {/* SCAN TICKET BUTTON */}
            <Link 
              to="/verify" 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all mr-2
                ${location.pathname === '/verify'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-indigo-50 dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-gray-700 hover:bg-indigo-100 dark:hover:bg-gray-700'
                }`}
            >
              <ScanLine size={18} />
              <span>Scan Ticket</span>
            </Link>

            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {admin ? (
              // ADMIN VIEW
              <div className="flex items-center gap-2">
                <Link to="/admin" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : user ? (
              // USER VIEW
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Welcome</p>
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
              // GUEST VIEW
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <Link to="/admin-login" className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                  Admin
                </Link>
                <Link to="/login" className="flex items-center gap-1 px-5 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-sm hover:shadow-md transition">
                  Login <ChevronRight size={14} className="text-indigo-600 dark:text-indigo-400"/>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext'; 

// Style & UI Feedback Imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Global Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

// Public & User Pages
import Landing from './pages/Landing';
import SearchBuses from './pages/SearchBuses';
import BusResults from './pages/BusResults';
import SeatSelection from './pages/SeatSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import LoginOptions from './pages/LoginOptions';
import AboutUs from './pages/AboutUs';
import TicketPrices from './pages/TicketPrices';
import PaymentHistory from './pages/PaymentHistory';
import BusSchedule from './pages/BusSchedule';
import SwitchUserWarning from './pages/SwitchUserWarning';
import BookingSuccess from './pages/BookingSuccess';
import Payment from './pages/Payment';
import Complaint from './pages/Complaint';
import TicketVerifier from './pages/TicketVerifier';

// --- NEW PAGE IMPORT ---
import ResetPassword from './pages/ResetPassword'; //

// Admin Pages
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AdminTripHistory from './pages/AdminTripHistory';
import AdminComplaints from './pages/AdminComplaints';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* ✅ MOBILE UPDATE: 
           'pb-[calc(5rem+env(safe-area-inset-bottom))]' ensures content 
           is not hidden behind the BottomNav on iPhones and Androids.
        */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300 relative pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          
          <Navbar />
          
          <ToastContainer 
            position="top-center" 
            autoClose={3000} 
            theme="colored" 
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
          />

          <Routes>
            {/* Core Booking Flow */}
            <Route path="/" element={<Landing />} />
            <Route path="/search" element={<SearchBuses />} />
            <Route path="/buses" element={<BusResults />} />
            <Route path="/seats/:busId" element={<SeatSelection />} />
            
            {/* Authentication Flow */}
            <Route path="/login-options" element={<LoginOptions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* --- NEW PASSWORD RESET ROUTE --- */}
            <Route path="/reset-password" element={<ResetPassword />} /> {/* */}
            
            <Route path="/switch-user" element={<SwitchUserWarning />} />
            
            {/* User Features & Information */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/prices" element={<TicketPrices />} />
            <Route path="/schedule" element={<BusSchedule />} />
            <Route path="/history" element={<PaymentHistory />} />
            <Route path="/verify" element={<TicketVerifier />} />
            <Route path="/complaint" element={<Complaint />} />
            
            {/* Transactional Pages */}
            <Route path="/payment" element={<Payment />} />
            <Route path="/booking-success/:id" element={<BookingSuccess />} />

            {/* Admin Portal */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/history" element={<AdminTripHistory />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
          </Routes>

          <BottomNav />

        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 👇 Context & Chatbot Imports (NEW)
import { ThemeProvider } from './context/ThemeContext';
import EnteBusChatBot from './components/ChatBot';

// 👇 Style & Toast Imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// 👇 Component & Page Imports
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import SearchBuses from './pages/SearchBuses';
import BusResults from './pages/BusResults';
import SeatSelection from './pages/SeatSelection';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import TicketVerifier from './pages/TicketVerifier';
import AboutUs from './pages/AboutUs';
import TicketPrices from './pages/TicketPrices';
import PaymentHistory from './pages/PaymentHistory';
import BusSchedule from './pages/BusSchedule';
import SwitchUserWarning from './pages/SwitchUserWarning';
import BookingSuccess from './pages/BookingSuccess';
import AdminTripHistory from './pages/AdminTripHistory';
import Payment from './pages/Payment';

export default function App() {
  return (
    // 1. Wrap the entire Router in the ThemeProvider
    <ThemeProvider>
      <BrowserRouter>
        {/* 2. Update the main div with dark mode classes and transition */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300 relative">
          
          <Navbar />
          
          {/* Toast Notifications */}
          <ToastContainer position="top-center" autoClose={3000} theme="colored" />

          {/* Page Routes */}
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/search" element={<SearchBuses />} />
            <Route path="/buses" element={<BusResults />} />
            <Route path="/seats/:busId" element={<SeatSelection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/prices" element={<TicketPrices />} />
            <Route path="/schedule" element={<BusSchedule />} />
            <Route path="/history" element={<PaymentHistory />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/verify" element={<TicketVerifier />} />
            <Route path="/switch-user" element={<SwitchUserWarning />} />
            <Route path="/booking-success/:id" element={<BookingSuccess />} />
            <Route path="/admin/history" element={<AdminTripHistory />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>

          {/* 3. Add the ChatBot here so it appears on all pages */}
          <EnteBusChatBot />

        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
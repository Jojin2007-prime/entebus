import React from 'react';
import ChatBot from 'react-chatbotify';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const EnteBusChatBot = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Chatbot logic
  const flow = {
    start: {
      message: "Welcome to EnteBus! 🚌 / EnteBus-ilekku Swagatham! 🙏\nHow can I help you today?",
      options: ["Book a Ticket", "Check PNR Status", "Fare Estimator", "Bus Routes", "Support"],
      path: "process_options"
    },
    process_options: {
      transition: { duration: 0 },
      path: (params) => {
        const input = params.userInput.toLowerCase();
        
        if (input.includes("book") || input.includes("ticket")) return "book_ticket";
        if (input.includes("pnr") || input.includes("status")) return "check_pnr";
        if (input.includes("fare") || input.includes("price") || input.includes("cost") || input.includes("calc")) return "fare_estimator";
        if (input.includes("route") || input.includes("schedule")) return "bus_routes";
        if (input.includes("support") || input.includes("help")) return "contact_support";
        if (input.includes("malayalam") || input.includes("swagatham") || input.includes("namaskaram")) return "malayalam_greet";
        
        return "unknown_input";
      }
    },
    
    // --- FEATURE 1: Smart PNR Checker (Mock) ---
    check_pnr: {
      message: "Please enter your PNR Number to check your ticket status (e.g., EB1023).",
      path: (params) => {
        // Simple logic: If it starts with 'EB', it's valid.
        const pnr = params.userInput.toUpperCase();
        if (pnr.startsWith("EB")) {
            return "pnr_found";
        } else {
            return "pnr_not_found";
        }
      }
    },
    pnr_found: {
        message: (params) => `✅ Status for ${params.userInput.toUpperCase()}:\n\nBus: Super Fast (KL-15-1234)\nStatus: CONFIRMED\nDeparts: 10:00 AM Today`,
        path: "anything_else"
    },
    pnr_not_found: {
        message: "❌ PNR not found. Please ensure it starts with 'EB'. Would you like to try again?",
        options: ["Yes, Try Again", "No, Main Menu"],
        path: (params) => {
            if (params.userInput === "Yes, Try Again") return "check_pnr";
            return "start";
        }
    },

    // --- FEATURE 2: Fare Estimator (With Calculation) ---
    fare_estimator: {
        message: "Select a route to estimate the total cost:",
        options: ["Tvm - Kochi (₹280)", "Kochi - Kozhikode (₹210)", "Kannur - Kasaragod (₹110)"],
        path: (params) => {
            if (params.userInput.includes("280")) return "calc_280";
            if (params.userInput.includes("210")) return "calc_210";
            if (params.userInput.includes("110")) return "calc_110";
            return "unknown_input";
        }
    },
    // Calculator Logic for Tvm - Kochi
    calc_280: {
        message: "Enter number of seats (e.g., 3):",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 280;
            params.injectMessage(`💰 Total Estimated Cost: ₹${total}\n(${seats} seats x ₹280)`);
            return "anything_else";
        }
    },
    // Calculator Logic for Kochi - Kozhikode
    calc_210: {
        message: "Enter number of seats (e.g., 2):",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 210;
            params.injectMessage(`💰 Total Estimated Cost: ₹${total}\n(${seats} seats x ₹210)`);
            return "anything_else";
        }
    },
    // Calculator Logic for Kannur - Kasaragod
    calc_110: {
        message: "Enter number of seats (e.g., 4):",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 110;
            params.injectMessage(`💰 Total Estimated Cost: ₹${total}\n(${seats} seats x ₹110)`);
            return "anything_else";
        }
    },
    invalid_number: {
        message: "⚠️ Please enter a valid number (e.g., 1, 2, 5).",
        path: "fare_estimator"
    },

    // --- FEATURE 3: Malayalam Greeting ---
    malayalam_greet: {
        message: "Namaskaram! 🙏 EnteBus-ilekku Swagatham. Njangalude sevannangal English-il mathrame labhyamullu. (Welcome! Our services are currently available in English).",
        path: "start"
    },

    // --- Standard Navigation Features ---
    book_ticket: {
      message: "You can book tickets directly on our home page! Shall I take you there?",
      options: ["Yes, Go Home", "No, Stay Here"],
      path: (params) => {
        if (params.userInput === "Yes, Go Home") {
            navigate('/');
            return "redirect_message";
        }
        return "anything_else";
      }
    },
    bus_routes: {
        message: "We operate across all major districts in Kerala. You can view the full schedule here:",
        options: ["View Schedule", "Back"],
        path: (params) => {
            if(params.userInput === "View Schedule") {
                navigate('/schedule');
                return "redirect_message";
            }
            return "start";
        }
    },
    contact_support: {
      message: "For complaints, please visit our Support Page.",
      options: ["Go to Support", "Back"],
      path: (params) => {
        if (params.userInput === "Go to Support") {
            navigate('/complaint');
            return "redirect_message";
        }
        return "start";
      }
    },

    // --- Utility Paths ---
    redirect_message: {
        message: "Navigating you there now... 🚀",
        path: "start"
    },
    anything_else: {
        message: "Is there anything else I can help you with?",
        options: ["Main Menu", "No, thanks"],
        path: (params) => {
            if (params.userInput === "No, thanks") return "end_chat";
            return "start";
        }
    },
    end_chat: {
        message: "Thank you for choosing EnteBus! Safe travels! 🚌✨",
        path: "start"
    },
    unknown_input: {
      message: "I didn't understand that. Please select an option:",
      options: ["Book Ticket", "Check PNR", "Fare Estimator", "Support"],
      path: "process_options"
    }
  };

  // Styling Options
  const botOptions = {
    theme: {
      primaryColor: '#4f46e5', // Matches your Indigo/Purple theme
      secondaryColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      headerFontColor: '#ffffff',
      botBubbleColor: '#4f46e5',
      botFontColor: '#ffffff',
      userBubbleColor: theme === 'dark' ? '#374151' : '#f3f4f6',
      userFontColor: theme === 'dark' ? '#ffffff' : '#000000',
    },
    chatWindow: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    },
    header: {
        title: 'EnteBus Assistant 🤖',
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712038.png'
    },
    tooltip: {
        mode: "CLOSE",
        text: "Talk to me! 👋"
    }
  };

  return (
    <ChatBot 
      options={botOptions} 
      flow={flow} 
      key={theme} 
    />
  );
};

export default EnteBusChatBot;
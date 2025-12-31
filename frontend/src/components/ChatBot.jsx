import React, { useState } from 'react';
import ChatBot from 'react-chatbotify';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const EnteBusChatBot = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [userName, setUserName] = useState(null);

  const flow = {
    // 1. Ask Name
    start: {
      message: "Hello! 👋 I am the EnteBus Assistant. May I know your name?",
      path: "save_name"
    },
    
    // 2. Save Name & Greet
    save_name: {
      message: (params) => {
        setUserName(params.userInput);
        return `Pleasure to meet you, ${params.userInput}! 🚀`;
      },
      transition: { duration: 1000 },
      path: "show_menu"
    },

    // 3. Main Menu
    show_menu: {
      message: "How can I help you today?",
      options: ["🎟️ Book Ticket", "🔍 Check PNR", "💰 Fare Calculator", "👮 Support"],
      path: "process_options"
    },

    // 4. Router (Process Inputs)
    process_options: {
      transition: { duration: 0 },
      path: (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("book")) return "book_ticket";
        if (input.includes("pnr") || input.includes("status")) return "check_pnr";
        if (input.includes("fare") || input.includes("calc")) return "fare_estimator";
        if (input.includes("support") || input.includes("help")) return "live_agent_simulation";
        return "unknown_input";
      }
    },

    // --- 🟢 FEATURE 1: Book Ticket (Smart Navigation) ---
    book_ticket: {
      message: (params) => {
        if (window.location.pathname === '/') {
          return "You are already on the Booking Page! 🏡 Scroll down to search for buses.";
        }
        navigate('/'); // Navigate immediately
        return "Navigating to the Booking Counter... 🚀";
      },
      transition: { duration: 2000 }, // Wait 2s for navigation to finish
      path: "anything_else" // 🔄 LOOP BACK
    },

    // --- 🟢 FEATURE 2: PNR Status ---
    check_pnr: {
      message: "Please enter your PNR Number (e.g., EB1023).",
      path: (params) => {
        const pnr = params.userInput.toUpperCase();
        if (pnr.startsWith("EB")) return "pnr_found";
        return "pnr_not_found";
      }
    },
    pnr_found: {
        message: (params) => 
`🎫 𝗕𝗢𝗢𝗞𝗜𝗡𝗚 𝗖𝗢𝗡𝗙𝗜𝗥𝗠𝗘𝗗
👤 Passenger: ${userName}
🆔 PNR: ${params.userInput.toUpperCase()}
🚌 Bus: Super Fast (KL-15-123)
✅ Status: ACTIVE`,
        path: "anything_else" // 🔄 LOOP BACK
    },
    pnr_not_found: {
        message: "🚫 Invalid PNR. Valid numbers start with 'EB'.",
        path: "anything_else" // 🔄 LOOP BACK (Gives chance to try again via menu)
    },

    // --- 🟢 FEATURE 3: Fare Estimator ---
    fare_estimator: {
        message: "Select a route:",
        options: ["TVM ➔ KOCHI (₹280)", "KOCHI ➔ KKD (₹210)", "KANNUR ➔ KSD (₹110)"],
        path: (params) => {
            if (params.userInput.includes("280")) return "calc_280";
            if (params.userInput.includes("210")) return "calc_210";
            if (params.userInput.includes("110")) return "calc_110";
            return "unknown_input";
        }
    },
    calc_280: {
        message: "Enter number of seats:",
        path: (params) => {
            const seats = parseInt(params.userInput) || 1;
            const total = seats * 280;
            params.injectMessage(`💳 Total: ₹${total} (${seats} seats)`);
            return "anything_else"; // 🔄 LOOP BACK
        }
    },
    calc_210: {
        message: "Enter number of seats:",
        path: (params) => {
            const seats = parseInt(params.userInput) || 1;
            const total = seats * 210;
            params.injectMessage(`💳 Total: ₹${total} (${seats} seats)`);
            return "anything_else"; // 🔄 LOOP BACK
        }
    },
    calc_110: {
        message: "Enter number of seats:",
        path: (params) => {
            const seats = parseInt(params.userInput) || 1;
            const total = seats * 110;
            params.injectMessage(`💳 Total: ₹${total} (${seats} seats)`);
            return "anything_else"; // 🔄 LOOP BACK
        }
    },

    // --- 🟢 FEATURE 4: Support ---
    live_agent_simulation: {
        message: "Connecting to agent... 🎧",
        transition: { duration: 2000 },
        path: "agent_busy"
    },
    agent_busy: {
        message: "⚠️ All agents are busy. Please go to the Support Page.",
        options: ["Go to Support", "No, Thanks"],
        path: (params) => {
            if (params.userInput === "Go to Support") {
                navigate('/complaint');
                return "redirect_message";
            }
            return "anything_else"; // 🔄 LOOP BACK
        }
    },

    // --- 🔄 THE LOOP LOGIC (ANYTHING ELSE?) ---
    redirect_message: {
        message: "Navigating... 🚀",
        path: "anything_else"
    },
    anything_else: {
        message: "Is there anything else I can help you with?",
        options: ["Main Menu", "No, thanks"],
        path: (params) => {
            if (params.userInput === "Main Menu") return "show_menu"; // Go back to start
            return "end_chat"; // End conversation
        }
    },
    end_chat: {
        message: "Safe travels! 🚌✨ (Chat will reset)",
        path: "start_again"
    },
    start_again: {
        message: "...",
        path: "show_menu"
    },
    unknown_input: {
      message: "I didn't understand. Please click an option below:",
      path: "show_menu"
    }
  };

  const botOptions = {
    theme: {
      primaryColor: '#4f46e5',
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
        height: '500px',
        width: '350px'
    },
    header: {
        title: 'EnteBus AI',
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',
        closeChatIcon: '✖️'
    },
    audio: { disabled: false },
    notification: { disabled: false, defaultToggledOn: true }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        <ChatBot options={botOptions} flow={flow} key={theme} />
    </div>
  );
};

export default EnteBusChatBot;
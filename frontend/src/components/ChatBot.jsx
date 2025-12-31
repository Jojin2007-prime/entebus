import React, { useState, useEffect } from 'react';
import ChatBot from 'react-chatbotify';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const EnteBusChatBot = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [userName, setUserName] = useState(null);

  // 1. Get Time-based Greeting (Good Morning/Evening)
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 18) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  };

  // Chatbot Logic
  const flow = {
    start: {
      message: () => `${getTimeGreeting()}! I am the EnteBus AI. What should I call you?`,
      path: "save_name"
    },
    save_name: {
      message: (params) => {
        setUserName(params.userInput);
        return `Pleasure to meet you, ${params.userInput}! 🚀 How can I assist you?`;
      },
      transition: { duration: 1000 }, // Typing animation
      options: ["🎟️ Book Ticket", "🔍 Check PNR", "💰 Fare Calculator", "👮 Support"],
      path: "process_options"
    },
    process_options: {
      transition: { duration: 0 },
      path: (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("book")) return "book_ticket";
        if (input.includes("pnr") || input.includes("status")) return "check_pnr";
        if (input.includes("fare") || input.includes("calc")) return "fare_estimator";
        if (input.includes("support") || input.includes("help")) return "live_agent_simulation"; // New Feature
        return "unknown_input";
      }
    },

    // --- FEATURE 1: Visual Ticket Card ---
    check_pnr: {
      message: "Please enter your PNR Number (e.g., EB1023).",
      path: (params) => {
        const pnr = params.userInput.toUpperCase();
        if (pnr.startsWith("EB")) return "pnr_found";
        return "pnr_not_found";
      }
    },
    pnr_found: {
        // We use emojis and spacing to make it look like a real ticket card
        message: (params) => 
`🎫 𝗕𝗢𝗢𝗞𝗜𝗡𝗚 𝗖𝗢𝗡𝗙𝗜𝗥𝗠𝗘𝗗 🎫
━━━━━━━━━━━━━━━━━
👤 Passenger: ${userName}
🆔 PNR: ${params.userInput.toUpperCase()}
🚌 Bus: Super Fast (KL-15-A-123)
📍 Route: TVM ➔ KOCHI
📅 Date: Today, 10:00 AM
━━━━━━━━━━━━━━━━━
✅ Status: ACTIVE`,
        options: ["Main Menu"],
        path: "process_options"
    },
    pnr_not_found: {
        message: "🚫 Invalid PNR. Valid numbers start with 'EB'.",
        path: "check_pnr"
    },

    // --- FEATURE 2: Smart Fare Calculator ---
    fare_estimator: {
        message: "Where are you traveling?",
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
            params.injectMessage(`💳 𝗧𝗢𝗧𝗔𝗟 𝗘𝗦𝗧𝗜𝗠𝗔𝗧𝗘: ₹${total}\n(${seats} seats x ₹280)`);
            return "anything_else";
        }
    },
    // (Repeat similiar blocks for calc_210 and calc_110 if needed, or keep it simple for now)

    // --- FEATURE 3: Fake Live Agent Simulation ---
    live_agent_simulation: {
        message: "Connecting you to a support agent... 🎧",
        transition: { duration: 2000 }, // Wait 2 seconds
        path: "agent_busy"
    },
    agent_busy: {
        message: "⚠️ All agents are currently busy. \nPlease visit our Support Page to leave a complaint.",
        options: ["Go to Support", "Main Menu"],
        path: (params) => {
            if (params.userInput === "Go to Support") {
                navigate('/complaint');
                return "redirect_message";
            }
            return "process_options";
        }
    },

    // --- Navigation & Utility ---
    book_ticket: {
      message: "Taking you to the booking counter! 🚀",
      transition: { duration: 1000 },
      path: (params) => {
        navigate('/');
        return "start_again";
      }
    },
    redirect_message: {
        message: "Navigating... 🚀",
        path: "start_again"
    },
    anything_else: {
        message: "Need anything else?",
        options: ["Main Menu", "No, thanks"],
        path: (params) => {
            if (params.userInput === "No, thanks") return "end_chat";
            return "process_options";
        }
    },
    end_chat: {
        message: "Safe travels! 🚌✨",
        path: "start_again"
    },
    start_again: {
        message: "...",
        path: "process_options"
    },
    unknown_input: {
      message: "I didn't understand. Try clicking an option below:",
      options: ["🎟️ Book Ticket", "🔍 Check PNR", "💰 Fare Calculator"],
      path: "process_options"
    }
  };

  // --- PREMIUM UI THEME ---
  const botOptions = {
    theme: {
      primaryColor: '#4f46e5', // Indigo
      secondaryColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headerFontColor: '#ffffff',
      botBubbleColor: '#4f46e5',
      botFontColor: '#ffffff',
      userBubbleColor: theme === 'dark' ? '#374151' : '#f3f4f6',
      userFontColor: theme === 'dark' ? '#ffffff' : '#000000',
    },
    chatWindow: {
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        height: '500px', // Taller window looks better
        width: '350px'
    },
    header: {
        title: 'EnteBus AI',
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png', // Modern Robot Icon
        closeChatIcon: '✖️'
    },
    footer: {
        text: '⚡ Powered by EnteBus'
    },
    audio: {
        disabled: false, // Sound ON
        notificationVolume: 0.4
    },
    tooltip: {
        mode: "START", 
        text: "Need Help? 👋"
    },
    notification: {
        disabled: false,
        defaultToggledOn: true
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        <ChatBot 
        options={botOptions} 
        flow={flow} 
        key={theme} // Re-render on theme change
        />
    </div>
  );
};

export default EnteBusChatBot;
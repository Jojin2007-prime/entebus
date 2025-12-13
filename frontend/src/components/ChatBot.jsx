import React from 'react';
import ChatBot from 'react-chatbotify';
import { useTheme } from '../context/ThemeContext';

const EnteBusChatBot = () => {
  const { theme } = useTheme();

  // Chatbot logic
  const flow = {
    start: {
      message: "Welcome to Ente Bus! 🚌 How can I help you today?",
      options: ["Book a Ticket", "Check Bus Status", "Refund Policy"],
      path: "process_options"
    },
    process_options: {
      transition: {duration: 0},
      path: (params) => {
        switch (params.userInput) {
          case "Book a Ticket": return "book_ticket";
          case "Check Bus Status": return "check_status";
          case "Refund Policy": return "refund_policy";
          default: return "unknown_input";
        }
      }
    },
    book_ticket: {
      message: "You can book tickets directly on our home page! Just select your Start and End destinations.",
      path: "start"
    },
    check_status: {
      message: "Please enter your PNR number to check status:",
      path: "pnr_check"
    },
    pnr_check: {
      message: "Checking PNR... (This is a demo response). Your bus is on time!",
      path: "start"
    },
    refund_policy: {
      message: "Cancellations made 24 hours before departure are 100% refundable.",
      path: "start"
    },
    unknown_input: {
      message: "I didn't quite catch that. Please select an option below.",
      options: ["Book a Ticket", "Check Bus Status", "Refund Policy"],
      path: "process_options"
    }
  };

  // Custom theme for the bot window
  const botOptions = {
    theme: {
      primaryColor: '#FF5733',
      secondaryColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
    },
    chatWindow: {
      backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6',
    }
  };

  return (
    <ChatBot 
      options={botOptions} 
      flow={flow} 
      // This forces the bot to re-render when theme changes so colors update
      key={theme} 
    />
  );
};

export default EnteBusChatBot;
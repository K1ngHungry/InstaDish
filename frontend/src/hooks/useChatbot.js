import React from 'react';
import apiService from '../services/api';

export const useChatbot = () => {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Hi! I'm your InstaDish cooking assistant! 🍳 I can help you with:\n\n• Recipe suggestions using your ingredients\n• Cooking techniques and tips\n• Ingredient substitutions\n• Sustainability advice\n\nWhat would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
      recipes: []
    }
  ]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const sendMessage = React.useCallback(async (message, userIngredients = []) => {
    if (!message || message.trim().length === 0) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.sendChatMessage(
        message, 
        messages, 
        userIngredients
      );

      const botMessage = {
        id: Date.now() + 1,
        text: response.response || "I'm sorry, I couldn't generate a response right now.",
        sender: 'bot',
        timestamp: new Date(),
        recipes: response.recipes || []
      };

      setMessages(prev => [...prev, botMessage]);

      if (!response.success) {
        setError(response.error || 'Failed to get response from chatbot');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Sorry, I had trouble connecting. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again later!",
        sender: 'bot',
        timestamp: new Date(),
        recipes: []
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearMessages = React.useCallback(() => {
    setMessages([
      {
        id: Date.now(),
        text: "Hi! I'm your InstaDish cooking assistant! 🍳 How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        recipes: []
      }
    ]);
    setError(null);
  }, []);

  const getQuickQuestions = React.useCallback(async (userIngredients = []) => {
    try {
      const response = await apiService.getQuickQuestions(userIngredients);
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Error getting quick questions:', err);
      return [];
    }
  }, []);

  const checkStatus = React.useCallback(async () => {
    try {
      const response = await apiService.getChatbotStatus();
      return response.success ? response.data : null;
    } catch (err) {
      console.error('Error checking chatbot status:', err);
      return null;
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    getQuickQuestions,
    checkStatus,
    hasMessages: messages.length > 1
  };
};

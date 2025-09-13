import React from 'react';

const Chatbot = ({ onRecipeClick, selectedIngredients = [] }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: selectedIngredients.length > 0 
        ? `Hi! I'm your InstaDish cooking assistant! 🍳 I can see you have ${selectedIngredients.length} ingredients selected: ${selectedIngredients.join(', ')}. I can help you with:\n\n• Recipe suggestions using your ingredients\n• Cooking techniques and tips\n• Ingredient substitutions\n• Sustainability advice\n\nWhat would you like to know?`
        : "Hi! I'm your InstaDish cooking assistant! 🍳 I can help you with:\n\n• Cooking techniques and tips\n• Ingredient substitutions\n• Sustainability advice\n• Recipe suggestions\n\nFirst, add some ingredients to get personalized recipe recommendations!",
      sender: 'bot',
      timestamp: new Date(),
      recipes: []
    }
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when ingredients change
  React.useEffect(() => {
    if (selectedIngredients.length > 0 && messages.length === 1) {
      setMessages([{
        id: 1,
        text: `Hi! I'm your InstaDish cooking assistant! 🍳 I can see you have ${selectedIngredients.length} ingredients selected: ${selectedIngredients.join(', ')}. I can help you with:\n\n• Recipe suggestions using your ingredients\n• Cooking techniques and tips\n• Ingredient substitutions\n• Sustainability advice\n\nWhat would you like to know?`,
        sender: 'bot',
        timestamp: new Date(),
        recipes: []
      }]);
    }
  }, [selectedIngredients]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          conversationHistory: messages,
          userIngredients: selectedIngredients
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.response || "I'm sorry, I couldn't generate a response right now.",
        sender: 'bot',
        timestamp: new Date(),
        recipes: data.recipes || []
      };

      setMessages(prev => [...prev, botMessage]);

      if (!data.success) {
        console.warn('Chatbot API returned success: false:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again later!",
        sender: 'bot',
        timestamp: new Date(),
        recipes: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getQuickQuestions = () => {
    if (selectedIngredients.length > 0) {
      return [
        "What recipes can I make with my ingredients?",
        "How can I make my meal more sustainable?",
        "What substitutions can I make?",
        "What's missing from my ingredients?"
      ];
    }
    return [
      "How do I know when chicken is cooked?",
      "What can I substitute for eggs?",
      "How do I reduce food waste?",
      "What's the most sustainable protein?"
    ];
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    // Auto-send after setting the value
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        aria-label="Toggle chatbot"
      >
        <span className="chat-icon">🍳</span>
        {!isOpen && <span className="chat-badge">💡</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="bot-avatar">👨‍🍳</span>
              <div>
                <h3>InstaDish AI Assistant</h3>
                <p>Powered by llama2:7b</p>
              </div>
            </div>
            <button 
              className="close-chat"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  <div className="message-text" style={{ whiteSpace: 'pre-line' }}>
                    {message.text}
                  </div>
                  {message.recipes && message.recipes.length > 0 && (
                    <div className="recipe-suggestions">
                      <h4>Here are some recipes I found:</h4>
                      {message.recipes.map((recipe) => (
                        <div 
                          key={recipe.id} 
                          className="recipe-suggestion"
                          onClick={() => onRecipeClick(recipe.id)}
                        >
                          <div className="recipe-suggestion-title">{recipe.title}</div>
                          <div className="recipe-suggestion-match">
                            {recipe.match.percentage}% match ({recipe.match.matches}/{recipe.match.total} ingredients)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="typing-text">AI is thinking...</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="quick-questions">
            <h4>Quick Questions:</h4>
            <div className="quick-question-buttons">
              {getQuickQuestions().map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isTyping}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedIngredients.length > 0 
                ? `Ask about recipes with ${selectedIngredients.join(', ')}, substitutions, or cooking tips...`
                : "Ask about cooking, sustainability, or ingredients..."
              }
              className="chat-input"
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="send-button"
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

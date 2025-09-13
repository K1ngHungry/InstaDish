import React, { useState, useRef, useEffect } from 'react';

interface ChatbotProps {
  userIngredients: string[];
  selectedRecipe?: any;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Chatbot: React.FC<ChatbotProps> = ({ userIngredients, selectedRecipe }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your InstaDish cooking assistant! 🍳 What would you like to cook today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          user_ingredients: userIngredients,
          selected_recipe: selectedRecipe
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: Date.now() + 1,
          text: data.response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later! 😅",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getQuickQuestions = () => {
    if (selectedRecipe) {
      const questions = [
        `How do I make ${selectedRecipe.name}?`,
        `What are the key steps for ${selectedRecipe.name}?`,
        `Can I substitute ingredients in ${selectedRecipe.name}?`
      ];

      // Add time-specific questions based on recipe timing
      if (selectedRecipe.prep_time && selectedRecipe.cook_time) {
        questions.push(`How long does ${selectedRecipe.name} take to cook?`);
      }

      // Add difficulty-specific questions
      if (selectedRecipe.difficulty) {
        if (selectedRecipe.difficulty.toLowerCase().includes('hard')) {
          questions.push(`What are the trickiest parts of ${selectedRecipe.name}?`);
        } else {
          questions.push(`What tips do you have for ${selectedRecipe.name}?`);
        }
      }

      // Add sustainability question if available
      if (selectedRecipe.sustainability) {
        questions.push(`Is ${selectedRecipe.name} sustainable?`);
      }

      // Add category-specific questions
      if (selectedRecipe.category) {
        if (selectedRecipe.category.toLowerCase().includes('dessert')) {
          questions.push(`How can I make ${selectedRecipe.name} healthier?`);
        } else if (selectedRecipe.category.toLowerCase().includes('main')) {
          questions.push(`What sides go well with ${selectedRecipe.name}?`);
        }
      }

      return questions.slice(0, 6); // Limit to 6 questions
    } else {
      return [
        "What can I make with my ingredients?",
        "How do I cook chicken properly?",
        "What are some healthy substitutions?",
        "How can I reduce food waste?"
      ];
    }
  };

  const quickQuestions = getQuickQuestions();

  return (
    <div className="chatbot">
      <div className="chatbot-header">
        <h3>🤖 AI Cooking Assistant</h3>
        {selectedRecipe ? (
          <div className="selected-recipe-indicator">
            <span className="selected-recipe-label">📌 Selected Recipe:</span>
            <span className="selected-recipe-name">{selectedRecipe.name}</span>
          </div>
        ) : (
          <p>Ask me anything about cooking, recipes, or ingredients!</p>
        )}
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-questions">
        <p className={selectedRecipe ? "recipe-specific-questions" : ""}>
          {selectedRecipe ? `Quick questions about ${selectedRecipe.name}:` : "Quick questions:"}
        </p>
        <div className="quick-question-buttons">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-question-button"
              onClick={() => setInputValue(question)}
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
          placeholder="Ask me about cooking..."
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;

import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketManager';
import '../styles/ChatModal.css';

const ChatModal = ({ onClose, studentName }) => {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { sender: 'AI Assistant', text: 'Hi! How can I help you today? I\'m your AI assistant for the live polling system. You can ask me questions about how to use the system, get help with features, or troubleshoot any issues.' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isTeacher = !studentName;

  // Static AI Response Generation Function
  const generateStaticAIResponse = (message, sender) => {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello ${sender}! I'm your AI assistant for the live polling system. How can I help you today?`;
    }
    
    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return `I can help you with various things related to the polling system:
      
• Ask questions about how to use the system
• Get help with poll creation and management
• Learn about features and functionality
• Troubleshoot any issues you might be having

What specific help do you need?`;
    }
    
    // Poll-related questions
    if (lowerMessage.includes('poll') || lowerMessage.includes('question') || lowerMessage.includes('vote')) {
      return `Here's how the polling system works:

**For Teachers:**
• Create polls with multiple choice questions
• Set time limits for polls
• View live results as students vote
• Manage student participants

**For Students:**
• Join polls using your name
• Answer questions by selecting options
• View live results after voting
• Chat with the AI assistant (that's me!)

Is there something specific about polls you'd like to know more about?`;
    }
    
    // Technical support
    if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return `I'm here to help with technical issues! Here are some common solutions:

• **Connection problems**: Try refreshing the page
• **Can't see polls**: Make sure you're connected to the same session
• **Voting issues**: Check if the poll is still active
• **Chat problems**: Ensure your internet connection is stable

Can you describe the specific issue you're experiencing?`;
    }
    
    // Feature questions
    if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('capabilities')) {
      return `The live polling system includes these features:

🎯 **Real-time Polling**: Create and participate in live polls
📊 **Live Results**: See results update in real-time
👥 **Student Management**: Teachers can manage participants
💬 **AI Assistant**: Get help and ask questions (that's me!)
📈 **Poll History**: View past polls and results
⏱️ **Timer Support**: Set time limits for polls

What feature would you like to learn more about?`;
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `You're welcome! I'm always here to help. Feel free to ask me anything about the polling system or if you need assistance with anything else!`;
    }
    
    // Time-related questions
    if (lowerMessage.includes('time') || lowerMessage.includes('timer') || lowerMessage.includes('duration')) {
      return `The polling system supports customizable timers:

⏱️ **Timer Features:**
• Teachers can set poll duration (default: 60 seconds)
• Automatic poll closure when time expires
• Real-time countdown display
• Results are shown immediately after timer expires

**How to set timers:**
• When creating a poll, specify the duration in seconds
• The system will automatically close the poll when time runs out
• All participants will see the final results

Need help with anything else about timers or polls?`;
    }
    
    // Default response for unrecognized messages
    return `I understand you're asking about "${message}". I'm an AI assistant designed to help with the live polling system. 

I can help you with:
• How to use the polling features
• Troubleshooting issues
• Understanding system capabilities
• General questions about the platform

Could you rephrase your question or ask about something specific I can help with?`;
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleParticipants = (list) => {
      setParticipants(Array.isArray(list) ? list : []);
    };

    socket.on('students:list', handleParticipants);

    // Ask server for the latest list when modal opens
    socket.emit('students:get');
    
    return () => {
      socket.off('students:list', handleParticipants);
    };
  }, [socket]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() !== '' && !isLoading) {
      const userMessage = {
        sender: studentName || 'Teacher',
        text: newMessage,
        timestamp: new Date().toISOString()
      };
      
      // Add user message to chat immediately
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Generate static AI response
      setIsLoading(true);
      
      // Simulate AI thinking time
      setTimeout(() => {
        const aiResponse = generateStaticAIResponse(newMessage, studentName || 'Teacher');
        const aiMessage = {
          sender: 'AI Assistant',
          text: aiResponse,
          timestamp: new Date().toISOString()
        };
        
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setIsLoading(false);
      }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
      
      setNewMessage('');
    }
  };

  const kickOut = (id) => {
    if (socket && isTeacher) {
      socket.emit('student:kick', id);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'participants' && socket) {
      socket.emit('students:get');
    }
  };

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal-content">
        <div className="chat-modal-header">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => switchTab('chat')}
            >
              AI Assistant
            </button>
            <button
              className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => switchTab('participants')}
            >
            Participants
            </button>
          </div>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="chat-modal-body">
          {activeTab === 'chat' && (
            <div className="chat-tab">
              <div className="message-container">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.sender === (studentName || 'Teacher') ? 'user-1' : 'user-2'}`}
                  >
                    <b>{msg.sender}:</b> {msg.text}
                  </div>
                ))}
              </div>
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder={isLoading ? "AI is thinking..." : "Ask me anything about the polling system..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <button 
                  className="send-button" 
                  onClick={handleSendMessage}
                  disabled={isLoading || newMessage.trim() === ''}
                >
                  {isLoading ? '⏳' : 'Send'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'participants' && (
            <div className="participants-tab">
              <div className="participants-header">
                <span>Total Participants: {participants.length}</span>
              </div>
              <ul className="participants-list">
                {participants.map((p) => (
                  <li key={p.id} className="participant-row">
                    <span className="participant-name">{p.name}</span>
                    {isTeacher && (
                      <button className="kick-button" onClick={() => kickOut(p.id)}>
                        Kick out
                      </button>
                    )}
                  </li>
                ))}
                {participants.length === 0 && (
                  <li className="participant-row empty">No students connected</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
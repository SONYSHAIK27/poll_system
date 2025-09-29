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

  useEffect(() => {
    if (!socket) return;
    
    const handleAIResponse = (response) => {
      setIsLoading(false);
      setMessages((prevMessages) => [...prevMessages, {
        sender: response.sender,
        text: response.text,
        timestamp: response.timestamp
      }]);
    };

    const handleParticipants = (list) => {
      setParticipants(Array.isArray(list) ? list : []);
    };

    socket.on('ai:response', handleAIResponse);
    socket.on('students:list', handleParticipants);

    // Ask server for the latest list when modal opens
    socket.emit('students:get');
    
    return () => {
      socket.off('ai:response', handleAIResponse);
      socket.off('students:list', handleParticipants);
    };
  }, [socket]);
  
  const handleSendMessage = () => {
    if (socket && newMessage.trim() !== '' && !isLoading) {
      const userMessage = {
        sender: studentName || 'Teacher',
        text: newMessage,
        timestamp: new Date().toISOString()
      };
      
      // Add user message to chat immediately
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Send AI chat request
      setIsLoading(true);
      socket.emit('ai:chat', {
        message: newMessage,
        sender: studentName || 'Teacher'
      });
      
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
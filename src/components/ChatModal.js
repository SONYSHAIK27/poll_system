import React, { useState, useEffect } from 'react';
import { useSocket } from './SocketManager';
import '../styles/ChatModal.css';

const ChatModal = ({ onClose, studentName }) => {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { sender: 'Helper Bot', text: 'Hi! How can I help you?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const isTeacher = !studentName;

  useEffect(() => {
    if (!socket) return;
    
    const handleIncoming = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleParticipants = (list) => {
      setParticipants(Array.isArray(list) ? list : []);
    };

    socket.on('chat:message', handleIncoming);
    socket.on('students:list', handleParticipants);

    // Ask server for the latest list when modal opens
    socket.emit('students:get');
    
    return () => {
      socket.off('chat:message', handleIncoming);
      socket.off('students:list', handleParticipants);
    };
  }, [socket]);
  
  const handleSendMessage = () => {
    if (socket && newMessage.trim() !== '') {
      const message = {
        sender: studentName || 'Teacher',
        text: newMessage,
      };
      socket.emit('chat:message', message);
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
              Chat
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
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="send-button" onClick={handleSendMessage}>
                  Send
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
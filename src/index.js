import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketManager } from './components/SocketManager';
import './styles/App.css';
import RoleSelection from './components/RoleSelection';
import StudentNameEntry from './components/StudentNameEntry';
import StudentPollView from './components/StudentPollView';
import StudentWaitView from './components/StudentWaitView';
import StudentLiveResults from './components/StudentLiveResults';
import TeacherLiveResults from './components/TeacherLiveResults';
import TeacherResultsWrapper from './components/TeacherResultsWrapper';
import ChatModal from './components/ChatModal';
import KickedOutView from './components/KickedOutView';
import TeacherPollHistory from './components/TeacherPollHistory';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/student" element={<StudentNameEntry />} />
        <Route path="/teacher" element={<TeacherResultsWrapper />} />
        <Route path="/student-wait" element={<StudentWaitView />} />
        <Route path="/student/poll" element={<StudentPollView />} />
        <Route path="/student/results" element={<StudentLiveResults />} />
        <Route path="/teacher/results" element={<TeacherLiveResults />} />
        <Route path="/kicked-out" element={<KickedOutView />} />
        <Route path="/chat-modal" element={<ChatModal />} />
        <Route path="/teacher/history" element={<TeacherPollHistory />} />
      </Routes>
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SocketManager>
      <App />
    </SocketManager>
  </React.StrictMode>
);
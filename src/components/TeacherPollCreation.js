import React, { useState } from 'react';

import '../styles/TeacherPollCreation.css';

const TeacherPollCreation = ({ onAskQuestion }) => {
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ text: '', isCorrect: false }]);
  const [pollTime, setPollTime] = useState(60);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleOptionChange = (index, e) => {
    const newOptions = [...options];
    newOptions[index].text = e.target.value;
    setOptions(newOptions);
  };

  const handleCorrectAnswerChange = (index, isCorrect) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const askQuestion = () => {
    const pollPayload = { question, options, pollTime };
    if (onAskQuestion) {
      onAskQuestion(pollPayload);
    }
  };

  return (
    <div className="teacher-container">
      <div className="teacher-header">
        <span className="logo-badge">Intervue Poll</span>
        <h1>Let's Get Started</h1>
        <p>You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.</p>
      </div>

      <div className="poll-form-card">
        <div className="form-header">
          <label htmlFor="poll-time">Time Limit</label>
          <select id="poll-time" value={pollTime} onChange={(e) => setPollTime(Number(e.target.value))}>
            <option value={60}>60 seconds</option>
            <option value={120}>120 seconds</option>
            <option value={180}>180 seconds</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="question">Enter your question</label>
          <textarea 
            id="question"
            placeholder="Rahul Bajaj"
            value={question}
            onChange={handleQuestionChange}
          />
        </div>

        <div className="form-group">
          <label>Edit Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionChange(index, e)}
                placeholder={`Option ${index + 1}`}
              />
              <div className="correct-answer-select">
                <label>Is it Correct?</label>
                <div className="radio-buttons">
                  <label>
                    <input
                      type="radio"
                      name={`correct-option-${index}`}
                      checked={option.isCorrect === true}
                      onChange={() => handleCorrectAnswerChange(index, true)}
                    /> Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`correct-option-${index}`}
                      checked={option.isCorrect === false}
                      onChange={() => handleCorrectAnswerChange(index, false)}
                    /> No
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button className="add-option-button" onClick={addOption}>
            + Add More option
          </button>
        </div>

        <button className="ask-question-button" onClick={askQuestion}>
          Ask Question
        </button>
      </div>
    </div>
  );
};

export default TeacherPollCreation;

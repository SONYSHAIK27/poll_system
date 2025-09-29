import React, { useEffect, useState } from "react";
import "../styles/TeacherLiveResults.css";

const TeacherPollHistory = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/polls`);
        if (!res.ok) throw new Error("Failed to fetch polls");
        const data = await res.json();
        setPolls(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  if (loading) {
    return <div className="live-results-container"><p>Loading history...</p></div>;
  }
  if (error) {
    return <div className="live-results-container"><p>Error: {error}</p></div>;
  }

  return (
    <div className="live-results-container">
      <div className="results-card history-card">
        <h2 className="results-question-label">View Poll History</h2>
        {polls.map((poll, idx) => {
          const totalVotes = poll.options.reduce((s, o) => s + (o.votes || 0), 0);
          return (
            <div key={poll._id || idx} style={{ marginBottom: "2rem" }}>
              <h3 style={{ margin: "1rem 0 0.5rem 0" }}>Question {polls.length - idx}</h3>
              <div className="question-display-box">
                <p className="question-text">{poll.question}</p>
              </div>
              <div className="options-list">
                {poll.options.map((option, index) => (
                  <div key={index} className="option-result-item">
                    <span className="option-label">
                      <span className="option-number">{index + 1}</span> {option.text}
                    </span>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="vote-percentage">
                      {totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherPollHistory;

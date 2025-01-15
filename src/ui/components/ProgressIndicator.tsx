import React from 'react';

interface ProgressIndicatorProps {
  progress: number;  // 0-100
  message?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && <div className="progress-message">{message}</div>}
    </div>
  );
}; 
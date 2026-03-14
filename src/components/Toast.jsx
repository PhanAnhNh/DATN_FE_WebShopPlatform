// components/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import '../css/AdminManageLayout.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">
        <div className={`toast-icon ${type}`}>
          {getIcon()}
        </div>
        <span className="toast-message">
          {message}
        </span>
        <button className="toast-close" onClick={onClose}>
          <X size={16}/>
        </button>
      </div>
      <div className="toast-progress">
        <div className="toast-progress-bar"></div>
      </div>
    </div>
  );
};

export default Toast;
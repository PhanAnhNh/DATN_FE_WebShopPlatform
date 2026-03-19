// components/ConfirmDialog.jsx
import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import '../../css/AdminManageLayout.css';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'warning' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'success':
        return <CheckCircle size={48} />;
      case 'error':
        return <AlertCircle size={48} />;
      case 'warning':
      default:
        return <AlertCircle size={48} />;
    }
  };

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <button className="confirm-dialog-close" onClick={onClose}>
          <X size={20}/>
        </button>

        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon ${type}`}>
            {getIcon()}
          </div>
          <h3 className={`confirm-dialog-title ${type}`}>
            {title}
          </h3>
        </div>

        <p className="confirm-dialog-message">
          {message}
        </p>

        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-btn cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className={`confirm-dialog-btn confirm ${type}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
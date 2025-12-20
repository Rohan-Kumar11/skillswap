"use client";

import { useState, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X, Trash2, Edit3 } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ id, message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-900'
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-red-500 to-pink-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    },
    info: {
      icon: Info,
      gradient: 'from-blue-500 to-purple-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    }
  };

  const { icon: Icon, gradient, bg, border, iconColor, textColor } = config[type];

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3 
        min-w-[320px] max-w-md
        ${bg} backdrop-blur-xl
        border-2 ${border}
        rounded-2xl shadow-2xl
        p-4 pr-3
        transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-x-8 scale-95' 
          : 'opacity-100 translate-x-0 scale-100'
        }
      `}
      style={{
        animation: isExiting ? 'none' : 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {/* Animated gradient border effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradient} opacity-20 blur-sm`} />
      
      {/* Icon with pulse animation */}
      <div 
        className={`relative flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center`}
        style={{
          animation: type === 'success' ? 'successPulse 0.6s ease-out' : 'none'
        }}
      >
        <Icon className={`${iconColor} w-5 h-5`} strokeWidth={2.5} />
      </div>

      {/* Message */}
      <p className={`flex-1 font-medium text-sm ${textColor} relative z-10`}>
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`
          relative z-10 flex-shrink-0
          w-8 h-8 rounded-full
          flex items-center justify-center
          ${iconColor} hover:bg-white/50
          transition-all duration-200
          hover:scale-110 active:scale-95
        `}
      >
        <X size={18} strokeWidth={2.5} />
      </button>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes successPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

// Simple Delete Confirmation Modal
export const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message = "Are you sure you want to delete this?",
  type = "post" // "post" or "comment"
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700/50 transform transition-all scale-100 animate-scaleIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            type === 'post' 
              ? 'bg-gradient-to-br from-red-500 to-pink-500' 
              : 'bg-gradient-to-br from-orange-500 to-red-500'
          }`}>
            <Trash2 className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-white text-base leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2.5 ${
              type === 'post'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
            } text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

/**
 * Custom Dialog Component - Replaces JavaScript alert() and prompt()
 */
export const CustomDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Dialog",
  message = "",
  type = "alert", // "alert" | "confirm" | "prompt"
  inputValue = "",
  inputPlaceholder = "Enter text...",
  confirmText = "OK",
  cancelText = "Cancel",
  icon: CustomIcon = null
}) => {
  const [value, setValue] = useState(inputValue);
  const [isExiting, setIsExiting] = useState(false);

  if (!isOpen && !isExiting) return null;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  };

  const handleConfirm = () => {
    if (type === "prompt") {
      onConfirm(value);
    } else {
      onConfirm(true);
    }
    handleClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== "alert") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const IconComponent = CustomIcon || (type === "confirm" ? AlertCircle : Edit3);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div 
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50 transform transition-all duration-200 ${
          isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              type === "confirm" 
                ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
              {message && (
                <p className="text-gray-300 text-sm leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Input field for prompt type */}
          {type === "prompt" && (
            <div className="mb-6">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                autoFocus
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {type !== "alert" && (
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${type === "alert" ? 'w-full' : 'flex-1'} px-4 py-2.5 bg-gradient-to-r ${
                type === "confirm"
                  ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  : 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white font-medium rounded-lg transition-all`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for using custom dialogs
 */
export const useDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    inputValue: '',
    inputPlaceholder: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    icon: null,
    onConfirm: () => {},
    onClose: () => {}
  });

  const showAlert = (title, message, icon = null) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'alert',
        title,
        message,
        icon,
        confirmText: 'OK',
        onConfirm: () => {
          resolve(true);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        },
        onClose: () => {
          resolve(false);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const showConfirm = (title, message, confirmText = 'Confirm', cancelText = 'Cancel', icon = null) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        icon,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        },
        onClose: () => {
          resolve(false);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const showPrompt = (title, message = '', inputValue = '', placeholder = 'Enter text...', icon = null) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        inputValue,
        inputPlaceholder: placeholder,
        icon,
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: (value) => {
          resolve(value);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        },
        onClose: () => {
          resolve(null);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const DialogComponent = () => <CustomDialog {...dialogState} />;

  return {
    showAlert,
    showConfirm,
    showPrompt,
    DialogComponent
  };
};
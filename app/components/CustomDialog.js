"use client";

import { useState, useEffect } from 'react';
import { X, AlertCircle, Edit3 } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      setValue(inputValue);
      setIsExiting(false);
    }
  }, [isOpen, inputValue]);

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
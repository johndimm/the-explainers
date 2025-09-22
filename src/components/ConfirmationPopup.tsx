'use client'

import React from 'react'

interface ConfirmationPopupProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}) => {
  if (!isOpen) return null

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }
    }
  }

  const buttonStyles = getButtonStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonStyles.cancel}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${buttonStyles.confirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPopup

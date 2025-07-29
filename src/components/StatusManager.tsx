'use client'

import { useState } from 'react'

interface OrderStatus {
  id: string
  status: string
  isActive: boolean
  notes?: string
  createdAt: string
}

// Comprehensive status definitions
const STATUS_CONFIG = {
  // Initial Phase
  ENQUIRY: { icon: '📞', label: 'Enquiry', color: 'bg-gray-100 text-gray-800', category: 'initial' },
  QUOTE_SENT: { icon: '📄', label: 'Quote Sent', color: 'bg-blue-100 text-blue-800', category: 'initial' },
  QUOTE_APPROVED: { icon: '✅', label: 'Quote Approved', color: 'bg-green-100 text-green-800', category: 'initial' },
  
  // Design Phase
  DESIGN_BRIEF: { icon: '📝', label: 'Design Brief', color: 'bg-purple-100 text-purple-800', category: 'design' },
  IN_DESIGN: { icon: '🎨', label: 'In Design', color: 'bg-purple-100 text-purple-800', category: 'design' },
  DESIGN_PROOFING: { icon: '👀', label: 'Proofing', color: 'bg-yellow-100 text-yellow-800', category: 'design' },
  DESIGN_APPROVED: { icon: '✅', label: 'Design Approved', color: 'bg-green-100 text-green-800', category: 'design' },
  
  // Materials & Payment
  MATERIALS_ORDERED: { icon: '📦', label: 'Materials Ordered', color: 'bg-orange-100 text-orange-800', category: 'materials' },
  MATERIALS_IN_STOCK: { icon: '📦', label: 'Stock in Hand', color: 'bg-green-100 text-green-800', category: 'materials' },
  PAYMENT_PENDING: { icon: '💳', label: 'Payment Pending', color: 'bg-red-100 text-red-800', category: 'payment' },
  PAYMENT_RECEIVED: { icon: '💰', label: 'Paid', color: 'bg-green-100 text-green-800', category: 'payment' },
  
  // Production Phase
  IN_PRODUCTION: { icon: '🏭', label: 'In Production', color: 'bg-blue-100 text-blue-800', category: 'production' },
  QUALITY_CHECK: { icon: '🔍', label: 'Quality Check', color: 'bg-orange-100 text-orange-800', category: 'production' },
  
  // Delivery Phase
  READY_FOR_DELIVERY: { icon: '📦', label: 'Ready', color: 'bg-green-100 text-green-800', category: 'delivery' },
  OUT_FOR_DELIVERY: { icon: '🚚', label: 'Out for Delivery', color: 'bg-blue-100 text-blue-800', category: 'delivery' },
  DELIVERED: { icon: '✅', label: 'Delivered', color: 'bg-gray-100 text-gray-800', category: 'delivery' },
  
  // Special States
  ON_HOLD: { icon: '⏸️', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', category: 'special' },
  CANCELLED: { icon: '❌', label: 'Cancelled', color: 'bg-red-100 text-red-800', category: 'special' },
}

interface StatusManagerProps {
  orderId: string
  currentStatuses: OrderStatus[]
  onStatusUpdate: (orderId: string, newStatuses: OrderStatus[]) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dropdown' | 'modal'
}

export default function StatusManager({ 
  orderId, 
  currentStatuses, 
  onStatusUpdate, 
  size = 'md',
  variant = 'dropdown' 
}: StatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    currentStatuses.filter(s => s.isActive).map(s => s.status)
  )
  const [updating, setUpdating] = useState(false)

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleSave = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statuses: selectedStatuses
        }),
      })

      if (response.ok) {
        const updatedStatuses = await response.json()
        onStatusUpdate(orderId, updatedStatuses)
        setIsOpen(false)
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const getMainStatus = (statuses: OrderStatus[]) => {
    const statusPriority = [
      'CANCELLED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY',
      'IN_PRODUCTION', 'QUALITY_CHECK', 'PAYMENT_RECEIVED', 'MATERIALS_IN_STOCK',
      'DESIGN_APPROVED', 'IN_DESIGN', 'DESIGN_PROOFING', 'DESIGN_BRIEF',
      'QUOTE_APPROVED', 'QUOTE_SENT', 'ENQUIRY', 'ON_HOLD'
    ]
    
    const activeStatuses = statuses.filter(s => s.isActive).map(s => s.status)
    
    for (const status of statusPriority) {
      if (activeStatuses.includes(status)) {
        return status
      }
    }
    
    return activeStatuses[0] || 'ENQUIRY'
  }

  const mainStatus = getMainStatus(currentStatuses)
  const statusConfig = STATUS_CONFIG[mainStatus as keyof typeof STATUS_CONFIG]

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  }

  if (variant === 'modal') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`btn btn-secondary ${sizeClasses[size]} flex items-center space-x-2`}
        >
          <span>{statusConfig?.icon || '📋'}</span>
          <span>{statusConfig?.label || mainStatus}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Update Job Status</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <label key={status} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-lg">{config.icon}</span>
                    <span className="flex-1 text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {config.category}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="btn btn-primary flex-1"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-secondary ${sizeClasses[size]} flex items-center space-x-2`}
      >
        <span>{statusConfig?.icon || '📋'}</span>
        <span>{statusConfig?.label || mainStatus}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="text-xs font-medium text-gray-600 mb-3">Select Statuses:</div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <label key={status} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-sm flex-1">{config.label}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                className="btn btn-primary btn-sm flex-1"
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
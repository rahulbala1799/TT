'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatEuro } from '@/lib/utils'

interface OrderStatus {
  id: string
  status: string
  isActive: boolean
  notes?: string
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  title: string
  statuses: OrderStatus[]
  priority: string
  totalPrice: string | number
  dueDate: string | null
  createdAt: string
  customer: {
    name: string
    company?: string
  }
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

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMainStatus = (statuses: OrderStatus[]) => {
    // Priority order for main status display
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-green-600 bg-green-50 border-green-200',
      NORMAL: 'text-blue-600 bg-blue-50 border-blue-200',
      HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
      URGENT: 'text-red-600 bg-red-50 border-red-200',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  // Group orders by date
  const groupOrdersByDate = () => {
    const grouped: { [key: string]: Order[] } = {}
    
    orders.forEach(order => {
      if (order.dueDate) {
        const date = new Date(order.dueDate).toDateString()
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(order)
      }
    })
    
    return grouped
  }

  // Get calendar data
  const getCalendarData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return { days, firstDay, lastDay }
  }

  // Get color for calendar day based on order count
  const getDayColor = (date: Date) => {
    const dateString = date.toDateString()
    const ordersForDay = groupOrdersByDate()[dateString] || []
    const count = ordersForDay.length
    
    if (count === 0) return 'bg-white hover:bg-gray-50'
    if (count <= 2) return 'bg-green-100 hover:bg-green-200 border-green-300'
    if (count <= 4) return 'bg-orange-100 hover:bg-orange-200 border-orange-300'
    return 'bg-red-100 hover:bg-red-200 border-red-300'
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const handleQuickCancel = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    setCancelling(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}?action=cancel`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh orders list
        fetchOrders()
      } else {
        alert('Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    } finally {
      setCancelling(null)
    }
  }

  // Calculate stats based on main status
  const getOrderStats = () => {
    const completed = orders.filter(o => {
      const mainStatus = getMainStatus(o.statuses)
      return mainStatus === 'DELIVERED'
    }).length

    const inProgress = orders.filter(o => {
      const mainStatus = getMainStatus(o.statuses)
      return ['IN_DESIGN', 'DESIGN_PROOFING', 'IN_PRODUCTION', 'QUALITY_CHECK'].includes(mainStatus)
    }).length

    return { completed, inProgress }
  }

  const { days } = getCalendarData()
  const groupedOrders = groupOrdersByDate()
  const { completed, inProgress } = getOrderStats()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4 w-12 h-12"></div>
            <p className="text-muted text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container-responsive section-padding">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-xl mb-4">PrintTrack Dashboard</h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Your complete printing order management system. Track jobs from enquiry to delivery.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-muted">Total Orders</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <div className="text-sm text-muted">Completed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{inProgress}</div>
            <div className="text-sm text-muted">In Progress</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatEuro(orders.reduce((sum, order) => sum + Number(order.totalPrice), 0))}
            </div>
            <div className="text-sm text-muted">Total Value</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/orders/add" className="btn btn-primary btn-lg flex-1">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Job
          </Link>
          <Link href="/orders" className="btn btn-secondary btn-lg flex-1">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h9.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00.293-.707V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View All Orders
          </Link>
        </div>

        {/* Calendar */}
        <div className="card p-6 mb-8">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="btn btn-secondary p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="heading-md">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={nextMonth}
              className="btn btn-secondary p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white border border-gray-300 rounded flex-shrink-0"></div>
              <span className="truncate">No orders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
              <span className="truncate">1-2 orders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-100 border border-orange-300 rounded flex-shrink-0"></div>
              <span className="truncate">3-4 orders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 rounded flex-shrink-0"></div>
              <span className="truncate">5+ orders</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-gray-600">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dateString = day.toDateString()
              const ordersForDay = groupedOrders[dateString] || []
              const isSelected = selectedDate === dateString
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(isSelected ? null : dateString)}
                  className={`
                    relative p-1 sm:p-2 h-10 sm:h-12 text-xs sm:text-sm font-medium border transition-all duration-200 rounded-lg
                    ${getDayColor(day)}
                    ${isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'}
                    ${isToday(day) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                    ${isSelected ? 'ring-2 ring-blue-600' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span>{day.getDate()}</span>
                    {ordersForDay.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {ordersForDay.length}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Orders */}
        {selectedDate && groupedOrders[selectedDate] && (
          <div className="card p-6 mb-8">
            <h3 className="heading-sm mb-4">
              Orders for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-4">
              {groupedOrders[selectedDate].map(order => {
                const mainStatus = getMainStatus(order.statuses)
                const statusConfig = STATUS_CONFIG[mainStatus as keyof typeof STATUS_CONFIG]
                
                return (
                  <div key={order.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:space-x-4 space-y-4 sm:space-y-0">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="text-xl sm:text-2xl flex-shrink-0">{statusConfig?.icon || '📋'}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate mb-2">
                            {order.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted mb-3">
                            <span className="font-medium">#{order.orderNumber}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">{order.customer.name}</span>
                            {order.customer.company && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="text-blue-600 truncate">{order.customer.company}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Multiple Status Display */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                            {order.statuses
                              .filter(s => s.isActive)
                              .slice(0, 3) // Show max 3 statuses on mobile
                              .map(status => {
                                const config = STATUS_CONFIG[status.status as keyof typeof STATUS_CONFIG]
                                return (
                                  <span 
                                    key={status.id}
                                    className={`px-1.5 sm:px-2 py-1 text-xs font-medium rounded-full ${config?.color || 'bg-gray-100 text-gray-800'}`}
                                  >
                                    <span className="hidden sm:inline">{config?.icon} </span>
                                    {config?.label || status.status}
                                  </span>
                                )
                              })}
                            {order.statuses.filter(s => s.isActive).length > 3 && (
                              <span className="px-1.5 sm:px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                +{order.statuses.filter(s => s.isActive).length - 3}
                              </span>
                            )}
                          </div>
                          
                          {/* Priority */}
                          <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 mb-3">
                          {formatEuro(Number(order.totalPrice))}
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 justify-center sm:justify-start">
                          <Link 
                            href={`/orders/${order.id}/edit`}
                            className="btn btn-primary btn-sm text-xs px-2 py-1 flex-1 sm:flex-none"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleQuickCancel(order.id)}
                            className="btn btn-danger btn-sm text-xs px-2 py-1 flex-1 sm:flex-none"
                            disabled={getMainStatus(order.statuses) === 'CANCELLED' || cancelling === order.id}
                          >
                            {cancelling === order.id ? 'Cancelling...' : 
                             getMainStatus(order.statuses) === 'CANCELLED' ? '❌ Cancelled' : '❌ Cancel'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Orders State */}
        {orders.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-8xl mb-6">📅</div>
            <h3 className="heading-md mb-4">No orders scheduled</h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Start by creating your first printing job to see it appear in your calendar.
            </p>
            <Link href="/orders/add" className="btn btn-primary btn-lg">
              Create Your First Job
            </Link>
          </div>
        )}

        {/* Footer CTA */}
        {orders.length > 0 && (
          <div className="text-center">
            <div className="card p-8">
              <h3 className="heading-sm mb-4">Ready to add another job?</h3>
              <p className="text-muted mb-6">Keep your production pipeline flowing with new orders.</p>
              <Link href="/orders/add" className="btn btn-primary btn-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Job
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatEuro } from '@/lib/utils'
import PasswordModal from '@/components/PasswordModal'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = sessionStorage.getItem('printtrack_authenticated') === 'true'
    setIsAuthenticated(authenticated)
    
    if (!authenticated) {
      setShowPasswordModal(true)
    } else {
      fetchOrders()
    }
  }, [])

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true)
    setShowPasswordModal(false)
    fetchOrders()
  }

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

  // Enhanced Analytics Functions
  const getTimeBasedStats = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const thisWeek = orders.filter(order => {
      if (!order.dueDate) return false
      const dueDate = new Date(order.dueDate)
      return dueDate >= startOfWeek && dueDate <= now
    })
    
    const thisMonth = orders.filter(order => {
      if (!order.dueDate) return false
      const dueDate = new Date(order.dueDate)
      return dueDate >= startOfMonth && dueDate <= endOfMonth
    })
    
    const overdue = orders.filter(order => {
      if (!order.dueDate) return false
      const dueDate = new Date(order.dueDate)
      return dueDate < now && getMainStatus(order.statuses) !== 'DELIVERED' && getMainStatus(order.statuses) !== 'CANCELLED'
    })
    
    const upcoming = orders.filter(order => {
      if (!order.dueDate) return false
      const dueDate = new Date(order.dueDate)
      const nextWeek = new Date(now)
      nextWeek.setDate(now.getDate() + 7)
      return dueDate > now && dueDate <= nextWeek
    })
    
    return { thisWeek, thisMonth, overdue, upcoming }
  }

  const getFinancialStats = () => {
    const totalValue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
    const completedOrders = orders.filter(order => getMainStatus(order.statuses) === 'DELIVERED')
    const completedValue = completedOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
    const pendingValue = totalValue - completedValue
    const averageOrderValue = orders.length > 0 ? totalValue / orders.length : 0
    
    // Monthly revenue (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)
      monthEnd.setHours(23, 59, 59, 999)
      
      const monthOrders = completedOrders.filter(order => {
        const completedAt = new Date(order.createdAt) // Using createdAt as proxy for completion
        return completedAt >= monthStart && completedAt <= monthEnd
      })
      
      const monthValue = monthOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        value: monthValue
      })
    }
    
    return { totalValue, completedValue, pendingValue, averageOrderValue, monthlyRevenue }
  }

  const getStatusDistribution = () => {
    const distribution: { [key: string]: number } = {}
    
    orders.forEach(order => {
      const mainStatus = getMainStatus(order.statuses)
      distribution[mainStatus] = (distribution[mainStatus] || 0) + 1
    })
    
    return distribution
  }

  const getCustomerStats = () => {
    const customerOrders: { [key: string]: { count: number, value: number, orders: Order[] } } = {}
    
    orders.forEach(order => {
      const customerKey = order.customer.company || order.customer.name
      if (!customerOrders[customerKey]) {
        customerOrders[customerKey] = { count: 0, value: 0, orders: [] }
      }
      customerOrders[customerKey].count++
      customerOrders[customerKey].value += Number(order.totalPrice)
      customerOrders[customerKey].orders.push(order)
    })
    
    const topCustomers = Object.entries(customerOrders)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }))
    
    return { topCustomers, totalCustomers: Object.keys(customerOrders).length }
  }

  const getPerformanceMetrics = () => {
    const completedOrders = orders.filter(order => getMainStatus(order.statuses) === 'DELIVERED')
    const completionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0
    
    // Calculate average processing time (simplified - using creation to current date)
    const processingTimes = completedOrders.map(order => {
      const created = new Date(order.createdAt)
      const now = new Date()
      return Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) // days
    })
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0
    
    return { completionRate, averageProcessingTime }
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

  // Calculate enhanced stats
  const { thisWeek, thisMonth, overdue, upcoming } = getTimeBasedStats()
  const { totalValue, completedValue, pendingValue, averageOrderValue, monthlyRevenue } = getFinancialStats()
  const statusDistribution = getStatusDistribution()
  const { topCustomers, totalCustomers } = getCustomerStats()
  const { completionRate, averageProcessingTime } = getPerformanceMetrics()

  const { days } = getCalendarData()
  const groupedOrders = groupOrdersByDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return (
      <PasswordModal 
        isOpen={showPasswordModal} 
        onSuccess={handlePasswordSuccess} 
      />
    )
  }

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
        <div className="text-center mb-8 relative">
          <h1 className="heading-xl mb-4">PrintTrack Dashboard</h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Your complete printing order management system. Track jobs from enquiry to delivery.
          </p>
          
          {/* Logout Button */}
          <button
            onClick={() => {
              sessionStorage.removeItem('printtrack_authenticated')
              setIsAuthenticated(false)
              setShowPasswordModal(true)
            }}
            className="absolute top-0 right-0 btn btn-ghost btn-sm text-gray-500 hover:text-gray-700"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-muted">Total Orders</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{thisWeek.length}</div>
            <div className="text-sm text-muted">This Week</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{overdue.length}</div>
            <div className="text-sm text-muted">Overdue</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatEuro(totalValue)}
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

        {/* Enhanced Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Overview */}
          <div className="card p-6">
            <h3 className="heading-sm mb-4 flex items-center">
              <span className="text-2xl mr-2">💰</span>
              Financial Overview
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{formatEuro(completedValue)}</div>
                  <div className="text-xs text-muted">Completed</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{formatEuro(pendingValue)}</div>
                  <div className="text-xs text-muted">Pending</div>
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{formatEuro(averageOrderValue)}</div>
                <div className="text-xs text-muted">Average Order Value</div>
              </div>
              
              {/* Monthly Revenue Chart */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Monthly Revenue (Last 6 Months)</h4>
                <div className="flex items-end justify-between h-20 space-x-1">
                  {monthlyRevenue.map((month, index) => {
                    const maxValue = Math.max(...monthlyRevenue.map(m => m.value))
                    const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-200 rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-muted mt-1">{month.month}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card p-6">
            <h3 className="heading-sm mb-4 flex items-center">
              <span className="text-2xl mr-2">📊</span>
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{completionRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted">Completion Rate</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{averageProcessingTime.toFixed(1)}</div>
                  <div className="text-xs text-muted">Avg Days</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{thisMonth.length}</div>
                  <div className="text-xs text-muted">This Month</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{upcoming.length}</div>
                  <div className="text-xs text-muted">Upcoming</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution & Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Distribution */}
          <div className="card p-6">
            <h3 className="heading-sm mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Status Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(statusDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([status, count]) => {
                  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                  const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{config?.icon || '📋'}</span>
                        <span className="text-sm font-medium">{config?.label || status}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top Customers */}
          <div className="card p-6">
            <h3 className="heading-sm mb-4 flex items-center">
              <span className="text-2xl mr-2">👥</span>
              Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{customer.name}</div>
                      <div className="text-xs text-muted">{customer.count} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatEuro(customer.value)}</div>
                    <div className="text-xs text-muted">
                      {orders.length > 0 ? ((customer.count / orders.length) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <span className="text-sm text-muted">Total Customers: {totalCustomers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Orders */}
        {overdue.length > 0 && (
          <div className="card p-6 mb-8">
            <h3 className="heading-sm mb-4 flex items-center text-red-600">
              <span className="text-2xl mr-2">⚠️</span>
              Overdue Orders ({overdue.length})
            </h3>
            <div className="space-y-3">
              {overdue.slice(0, 5).map(order => {
                const mainStatus = getMainStatus(order.statuses)
                const statusConfig = STATUS_CONFIG[mainStatus as keyof typeof STATUS_CONFIG]
                const daysOverdue = Math.ceil((new Date().getTime() - new Date(order.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{statusConfig?.icon || '📋'}</div>
                      <div>
                        <div className="font-medium">{order.title}</div>
                        <div className="text-sm text-muted">#{order.orderNumber} • {order.customer.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{formatEuro(Number(order.totalPrice))}</div>
                      <div className="text-sm text-red-600">{daysOverdue} days overdue</div>
                    </div>
                  </div>
                )
              })}
              {overdue.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-muted">+{overdue.length - 5} more overdue orders</span>
                </div>
              )}
            </div>
          </div>
        )}

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
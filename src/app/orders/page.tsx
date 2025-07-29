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
  totalPrice: number
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    const mainStatus = getMainStatus(order.statuses)
    
    switch (filter) {
      case 'active':
        return !['DELIVERED', 'CANCELLED'].includes(mainStatus)
      case 'completed':
        return mainStatus === 'DELIVERED'
      case 'cancelled':
        return mainStatus === 'CANCELLED'
      case 'urgent':
        return order.priority === 'URGENT'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4 w-12 h-12"></div>
            <p className="text-muted text-lg">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container-responsive section-padding">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="heading-xl mb-2">All Orders</h1>
            <p className="text-muted">
              Manage and track all your printing orders from enquiry to delivery
            </p>
          </div>
          <Link href="/orders/add" className="btn btn-primary mt-4 sm:mt-0">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'active', label: 'Active', count: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(getMainStatus(o.statuses))).length },
            { key: 'completed', label: 'Completed', count: orders.filter(o => getMainStatus(o.statuses) === 'DELIVERED').length },
            { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => getMainStatus(o.statuses) === 'CANCELLED').length },
            { key: 'urgent', label: 'Urgent', count: orders.filter(o => o.priority === 'URGENT').length },
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`btn ${filter === filterOption.key ? 'btn-primary' : 'btn-secondary'} text-sm`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-8xl mb-6">📋</div>
            <h3 className="heading-md mb-4">
              {filter === 'all' ? 'No orders found' : `No ${filter} orders`}
            </h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Start by creating your first printing job.'
                : `There are currently no ${filter} orders to display.`
              }
            </p>
            {filter === 'all' && (
              <Link href="/orders/add" className="btn btn-primary btn-lg">
                Create Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const mainStatus = getMainStatus(order.statuses)
              const statusConfig = STATUS_CONFIG[mainStatus as keyof typeof STATUS_CONFIG]
              
              return (
                <div key={order.id} className="card p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="text-3xl">{statusConfig?.icon || '📋'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="heading-sm mb-1 truncate">{order.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                              <span className="font-medium">#{order.orderNumber}</span>
                              <span>•</span>
                              <span>{order.customer.name}</span>
                              {order.customer.company && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600">{order.customer.company}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Multiple Status Display */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {order.statuses
                            .filter(s => s.isActive)
                            .slice(0, 5) // Show max 5 statuses
                            .map(status => {
                              const config = STATUS_CONFIG[status.status as keyof typeof STATUS_CONFIG]
                              return (
                                <span 
                                  key={status.id}
                                  className={`px-3 py-1 text-sm font-medium rounded-full ${config?.color || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {config?.icon} {config?.label || status.status}
                                </span>
                              )
                            })}
                          {order.statuses.filter(s => s.isActive).length > 5 && (
                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                              +{order.statuses.filter(s => s.isActive).length - 5} more
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                          <div className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(order.priority)}`}>
                            {order.priority} Priority
                          </div>
                          {order.dueDate && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Due {new Date(order.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Created {new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-900 mb-3">
                        {formatEuro(order.totalPrice)}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link 
                          href={`/orders/${order.id}/edit`}
                          className="btn btn-primary btn-sm"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleQuickCancel(order.id)}
                          className="btn btn-danger btn-sm"
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
        )}

        {/* Quick Stats */}
        {orders.length > 0 && (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xl font-bold text-blue-600">{orders.length}</div>
              <div className="text-sm text-muted">Total Orders</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xl font-bold text-green-600">
                {orders.filter(o => getMainStatus(o.statuses) === 'DELIVERED').length}
              </div>
              <div className="text-sm text-muted">Completed</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xl font-bold text-orange-600">
                {orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(getMainStatus(o.statuses))).length}
              </div>
              <div className="text-sm text-muted">Active</div>
            </div>
            <div className="card p-4 text-center">
                          <div className="text-xl font-bold text-gray-900">
              {formatEuro(orders.reduce((sum, order) => sum + order.totalPrice, 0))}
            </div>
              <div className="text-sm text-muted">Total Value</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
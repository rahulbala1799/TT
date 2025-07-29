'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatEuro } from '@/lib/utils'
import StatusManager from '@/components/StatusManager'

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
  description?: string
  statuses: OrderStatus[]
  priority: string
  totalPrice: string | number
  dueDate: string | null
  createdAt: string
  customer: {
    name: string
    company?: string
    email?: string
    phone?: string
  }
  orderItems?: Array<{
    id: string
    name: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
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

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string)
    }
  }, [params.id])

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        throw new Error('Order not found')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (orderId: string, newStatuses: OrderStatus[]) => {
    setOrder(prev => prev ? { ...prev, statuses: newStatuses } : null)
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${order?.id}?action=cancel`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/orders')
      } else {
        alert('Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    } finally {
      setCancelling(false)
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-green-600 bg-green-50 border-green-200',
      NORMAL: 'text-blue-600 bg-blue-50 border-blue-200',
      HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
      URGENT: 'text-red-600 bg-red-50 border-red-200',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4 w-12 h-12"></div>
            <p className="text-muted text-lg">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="text-center py-20">
            <h1 className="heading-xl mb-4">Order Not Found</h1>
            <p className="text-muted mb-8">The order you're looking for doesn't exist.</p>
            <Link href="/orders" className="btn btn-primary">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mainStatus = getMainStatus(order.statuses)
  const statusConfig = STATUS_CONFIG[mainStatus as keyof typeof STATUS_CONFIG]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/orders" className="btn btn-ghost">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </Link>
            <h1 className="heading-sm lg:heading-md">Order #{order.orderNumber}</h1>
            <div className="flex items-center space-x-2">
              <Link href={`/orders/${order.id}/edit`} className="btn btn-primary btn-sm">
                ✏️ Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Order Header */}
          <div className="card p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{statusConfig?.icon || '📋'}</div>
                  <div className="flex-1">
                    <h1 className="heading-lg mb-2">{order.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span>•</span>
                      <span>Created {new Date(order.createdAt).toLocaleDateString()}</span>
                      {order.dueDate && (
                        <>
                          <span>•</span>
                          <span>Due {new Date(order.dueDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {order.description && (
                  <p className="text-gray-600 mb-4">{order.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(order.priority)}`}>
                    {order.priority} Priority
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatEuro(Number(order.totalPrice))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <StatusManager
                  orderId={order.id}
                  currentStatuses={order.statuses}
                  onStatusUpdate={handleStatusUpdate}
                  size="lg"
                  variant="modal"
                />
                <button
                  onClick={handleCancel}
                  disabled={cancelling || mainStatus === 'CANCELLED'}
                  className="btn btn-danger btn-lg"
                >
                  {cancelling ? 'Cancelling...' : 
                   mainStatus === 'CANCELLED' ? '❌ Cancelled' : '❌ Cancel Order'}
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card p-6 lg:p-8">
            <h2 className="heading-md mb-6">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{order.customer.name}</h3>
                {order.customer.company && (
                  <p className="text-blue-600 mb-2">{order.customer.company}</p>
                )}
                {order.customer.email && (
                  <p className="text-gray-600 mb-1">{order.customer.email}</p>
                )}
                {order.customer.phone && (
                  <p className="text-gray-600">{order.customer.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          {order.orderItems && order.orderItems.length > 0 && (
            <div className="card p-6 lg:p-8">
              <h2 className="heading-md mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>€{item.unitPrice.toFixed(2)} each</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatEuro(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="card p-6 lg:p-8">
            <h2 className="heading-md mb-6">Current Status</h2>
            <div className="space-y-3">
              {order.statuses
                .filter(s => s.isActive)
                .map(status => {
                  const config = STATUS_CONFIG[status.status as keyof typeof STATUS_CONFIG]
                  return (
                    <div key={status.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{config?.icon || '📋'}</span>
                        <div>
                          <div className="font-medium">{config?.label || status.status}</div>
                          {status.notes && (
                            <div className="text-sm text-gray-600">{status.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(status.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
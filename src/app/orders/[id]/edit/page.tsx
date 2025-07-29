'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  description?: string
  priority: string
  dueDate: string | null
  statuses: OrderStatus[]
  customer: {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
  }
  orderItems: {
    id: string
    name: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

// Status configuration
const STATUS_CONFIG = {
  ENQUIRY: { icon: '📞', label: 'Enquiry', color: 'bg-gray-100 text-gray-800' },
  QUOTE_SENT: { icon: '📄', label: 'Quote Sent', color: 'bg-blue-100 text-blue-800' },
  QUOTE_APPROVED: { icon: '✅', label: 'Quote Approved', color: 'bg-green-100 text-green-800' },
  DESIGN_BRIEF: { icon: '📝', label: 'Design Brief', color: 'bg-purple-100 text-purple-800' },
  IN_DESIGN: { icon: '🎨', label: 'In Design', color: 'bg-purple-100 text-purple-800' },
  DESIGN_PROOFING: { icon: '👀', label: 'Proofing', color: 'bg-yellow-100 text-yellow-800' },
  DESIGN_APPROVED: { icon: '✅', label: 'Design Approved', color: 'bg-green-100 text-green-800' },
  MATERIALS_ORDERED: { icon: '📦', label: 'Materials Ordered', color: 'bg-orange-100 text-orange-800' },
  MATERIALS_IN_STOCK: { icon: '📦', label: 'Stock in Hand', color: 'bg-green-100 text-green-800' },
  PAYMENT_PENDING: { icon: '💳', label: 'Payment Pending', color: 'bg-red-100 text-red-800' },
  PAYMENT_RECEIVED: { icon: '💰', label: 'Paid', color: 'bg-green-100 text-green-800' },
  IN_PRODUCTION: { icon: '🏭', label: 'In Production', color: 'bg-blue-100 text-blue-800' },
  QUALITY_CHECK: { icon: '🔍', label: 'Quality Check', color: 'bg-orange-100 text-orange-800' },
  READY_FOR_DELIVERY: { icon: '📦', label: 'Ready', color: 'bg-green-100 text-green-800' },
  OUT_FOR_DELIVERY: { icon: '🚚', label: 'Out for Delivery', color: 'bg-blue-100 text-blue-800' },
  DELIVERED: { icon: '✅', label: 'Delivered', color: 'bg-gray-100 text-gray-800' },
  ON_HOLD: { icon: '⏸️', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  CANCELLED: { icon: '❌', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL',
    dueDate: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    products: [] as any[]
  })

  // Status management
  const [activeStatuses, setActiveStatuses] = useState<string[]>([])
  const [statusesToAdd, setStatusesToAdd] = useState<string[]>([])
  const [statusesToRemove, setStatusesToRemove] = useState<string[]>([])

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        
        // Initialize form data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          priority: data.priority || 'NORMAL',
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
          clientName: data.customer.name || '',
          clientEmail: data.customer.email || '',
          clientPhone: data.customer.phone || '',
          clientCompany: data.customer.company || '',
          products: data.orderItems.map((item: any) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: item.unitPrice
          }))
        })

        // Initialize active statuses
        const currentStatuses = data.statuses.filter((s: any) => s.isActive).map((s: any) => s.status)
        setActiveStatuses(currentStatuses)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          statusesToAdd,
          statusesToRemove
        })
      })

      if (response.ok) {
        router.push('/orders')
      } else {
        alert('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${params.id}?action=cancel`, {
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
      setSaving(false)
      setShowCancelConfirm(false)
    }
  }

  const toggleStatus = (status: string) => {
    const isCurrentlyActive = activeStatuses.includes(status)
    
    if (isCurrentlyActive) {
      // Remove status
      setActiveStatuses(prev => prev.filter(s => s !== status))
      if (!statusesToAdd.includes(status)) {
        setStatusesToRemove(prev => [...prev.filter(s => s !== status), status])
      } else {
        setStatusesToAdd(prev => prev.filter(s => s !== status))
      }
    } else {
      // Add status
      setActiveStatuses(prev => [...prev, status])
      if (!statusesToRemove.includes(status)) {
        setStatusesToAdd(prev => [...prev.filter(s => s !== status), status])
      } else {
        setStatusesToRemove(prev => prev.filter(s => s !== status))
      }
    }
  }

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', description: '', quantity: 1, price: 0 }]
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4 w-12 h-12"></div>
            <p className="text-muted text-lg">Loading order...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container-responsive section-padding">
          <div className="card p-12 text-center">
            <div className="text-8xl mb-6">❌</div>
            <h3 className="heading-md mb-4">Order not found</h3>
            <Link href="/orders" className="btn btn-primary">
              Back to Orders
            </Link>
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
            <h1 className="heading-xl mb-2">Edit Order #{order.orderNumber}</h1>
            <p className="text-muted">Update order details and manage status</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="btn btn-danger"
              disabled={saving}
            >
              ❌ Cancel Order
            </button>
            <Link href="/orders" className="btn btn-secondary">
              Back to Orders
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="heading-sm mb-4">Order Information</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter job description"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="input"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="card p-6">
              <h2 className="heading-sm mb-4">Customer Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-sm">Products</h2>
                <button onClick={addProduct} className="btn btn-secondary btn-sm">
                  + Add Product
                </button>
              </div>

              <div className="space-y-4">
                {formData.products.map((product, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="form-group">
                        <label className="form-label text-sm">Product Name</label>
                        <input
                          type="text"
                          className="input"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label text-sm">Quantity</label>
                        <input
                          type="number"
                          className="input"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label text-sm">Unit Price (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          value={product.price}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => removeProduct(index)}
                          className="btn btn-danger btn-sm w-full"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-sm">Description</label>
                      <input
                        type="text"
                        className="input"
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="text-right text-sm font-medium text-gray-900">
                      Total: {formatEuro(product.quantity * product.price)}
                    </div>
                  </div>
                ))}

                {formData.products.length === 0 && (
                  <div className="text-center py-8 text-muted">
                    No products added yet. Click "Add Product" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Management Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="heading-sm mb-4">Order Status</h2>
              <div className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const isActive = activeStatuses.includes(status)
                  const willBeAdded = statusesToAdd.includes(status)
                  const willBeRemoved = statusesToRemove.includes(status)
                  
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`
                        w-full p-3 rounded-xl border-2 transition-all duration-200 text-left
                        ${isActive && !willBeRemoved
                          ? `${config.color} border-current shadow-sm`
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }
                        ${willBeAdded ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
                        ${willBeRemoved ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        {willBeAdded && <span className="text-xs text-green-600">+</span>}
                        {willBeRemoved && <span className="text-xs text-red-600">-</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Save Actions */}
            <div className="card p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary w-full btn-lg"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                
                <Link href="/orders" className="btn btn-secondary w-full">
                  Cancel & Go Back
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-md w-full">
              <h3 className="heading-sm mb-4">Cancel Order?</h3>
              <p className="text-muted mb-6">
                This will mark the order as cancelled. This action can be undone by editing the order status.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn btn-danger flex-1"
                >
                  {saving ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
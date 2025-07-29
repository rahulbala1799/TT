'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatEuro } from '@/lib/utils'

interface ProductItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: number
}

const PRINTING_PRODUCTS = [
  { name: 'Business Cards', description: '350gsm Premium', unitPrice: 25, icon: '💼', category: 'Marketing' },
  { name: 'Flyers A4', description: '130gsm Gloss', unitPrice: 15, icon: '📄', category: 'Marketing' },
  { name: 'Brochures', description: '150gsm Tri-fold', unitPrice: 35, icon: '📖', category: 'Marketing' },
  { name: 'Posters A3', description: '200gsm Satin', unitPrice: 12, icon: '🖼️', category: 'Display' },
  { name: 'Banners', description: 'Vinyl Weather-proof', unitPrice: 45, icon: '🎌', category: 'Display' },
  { name: 'Stickers', description: 'Vinyl Die-cut', unitPrice: 20, icon: '🏷️', category: 'Specialty' },
  { name: 'Digital Prints', description: 'High Resolution', unitPrice: 8, icon: '🖨️', category: 'Digital' },
  { name: 'Custom Job', description: 'Bespoke Solution', unitPrice: 0, icon: '⚙️', category: 'Custom' },
]

export default function AddJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    status: 'PENDING',
    priority: 'NORMAL',
    designRequired: false,
    dueDate: '',
    description: '',
  })
  const [products, setProducts] = useState<ProductItem[]>([])
  const [showCustomProduct, setShowCustomProduct] = useState(false)
  const [customProduct, setCustomProduct] = useState({
    name: '',
    unitPrice: 0,
    quantity: 1,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const addProduct = (product: typeof PRINTING_PRODUCTS[0]) => {
    const newItem: ProductItem = {
      id: Date.now().toString(),
      name: product.name,
      description: product.description,
      quantity: 1,
      unitPrice: product.unitPrice,
    }
    setProducts(prev => [...prev, newItem])
  }

  const addCustomProductToList = () => {
    if (!customProduct.name) return
    
    const newItem: ProductItem = {
      id: Date.now().toString(),
      name: customProduct.name,
      description: 'Custom',
      quantity: customProduct.quantity,
      unitPrice: customProduct.unitPrice,
    }
    setProducts(prev => [...prev, newItem])
    setCustomProduct({ name: '', unitPrice: 0, quantity: 1 })
    setShowCustomProduct(false)
  }

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const updateProductQuantity = (id: string, quantity: number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p
    ))
  }

  const updateProductPrice = (id: string, unitPrice: number) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, unitPrice: Math.max(0, unitPrice) } : p
    ))
  }

  const calculateTotal = () => {
    return products.reduce((total, product) => total + (product.quantity * product.unitPrice), 0)
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const orderData = {
        ...formData,
        orderValue: calculateTotal(),
        products,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        router.push('/orders')
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remove all mandatory field requirements
  const canProceedToStep2 = true
  const canSubmit = true

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/orders" className="btn btn-ghost">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="heading-sm lg:heading-md">Create New Job</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Modern Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive">
          <div className="flex">
            <div className={`progress-step ${step === 1 ? 'progress-step-active' : 'progress-step-inactive'}`}>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="hidden sm:inline">Job Details</span>
              </div>
            </div>
            <div className={`progress-step ${step === 2 ? 'progress-step-active' : 'progress-step-inactive'}`}>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="hidden sm:inline">Products & Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive section-padding pb-32">
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Job Title */}
            <div className="card card-hover p-6 lg:p-8">
              <div className="form-group">
                <label className="form-label text-base font-semibold">
                  What are you printing?
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input input-lg"
                  placeholder="e.g., Business Cards for ABC Company"
                />
                <p className="form-help">Give your job a clear, descriptive title</p>
              </div>
            </div>

            {/* Client Information */}
            <div className="card card-hover p-6 lg:p-8">
              <h2 className="heading-sm mb-6">Client Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    name="clientCompany"
                    value={formData.clientCompany}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="ABC Company"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="john@company.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Job Settings */}
            <div className="card card-hover p-6 lg:p-8">
              <h2 className="heading-sm mb-6">Job Settings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="LOW">🟢 Low Priority</option>
                    <option value="NORMAL">🔵 Normal Priority</option>
                    <option value="HIGH">🟡 High Priority</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="PENDING">📋 Pending</option>
                    <option value="IN_DESIGN">🎨 In Design</option>
                    <option value="IN_PRODUCTION">🏭 In Production</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="designRequired"
                    checked={formData.designRequired}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Design Required</div>
                    <div className="text-sm text-gray-600">This job needs design work before production</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Product Selection */}
            <div className="card card-hover p-6 lg:p-8">
              <h2 className="heading-sm mb-6">Select Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {PRINTING_PRODUCTS.map((product, index) => (
                  <div
                    key={index}
                    onClick={() => addProduct(product)}
                    className="product-card group"
                  >
                    <div className="flex flex-col h-full">
                      <div className="text-3xl mb-3">{product.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 flex-1">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">{formatEuro(product.unitPrice)}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Product */}
              <div className="mt-6">
                <button
                  onClick={() => setShowCustomProduct(!showCustomProduct)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Custom Product</span>
                  </div>
                </button>

                {showCustomProduct && (
                  <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Custom Product Details</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label">Product Name</label>
                        <input
                          type="text"
                          placeholder="Custom product name"
                          value={customProduct.name}
                          onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={customProduct.quantity}
                          onChange={(e) => setCustomProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          className="input"
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Unit Price (€)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={customProduct.unitPrice}
                          onChange={(e) => setCustomProduct(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                          className="input"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => setShowCustomProduct(false)}
                        className="btn btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addCustomProductToList}
                        className="btn btn-primary flex-1"
                        disabled={!customProduct.name}
                      >
                        Add Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Products */}
            {products.length > 0 && (
              <div className="card card-hover p-6 lg:p-8">
                <h2 className="heading-sm mb-6">Selected Products ({products.length})</h2>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Quantity Control */}
                          <div className="flex items-center">
                            <label className="text-sm text-gray-600 mr-2">Qty:</label>
                            <div className="quantity-control">
                              <button
                                onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                                className="quantity-btn"
                              >
                                −
                              </button>
                              <span className="px-4 py-2 text-center font-medium min-w-[60px]">
                                {product.quantity}
                              </span>
                              <button
                                onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                                className="quantity-btn"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Price Control */}
                          <div className="flex items-center">
                            <label className="text-sm text-gray-600 mr-2">€</label>
                            <input
                              type="number"
                              value={product.unitPrice}
                              onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value) || 0)}
                              className="input w-20 text-center"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          {/* Total */}
                          <div className="text-lg font-bold text-gray-900 min-w-[80px] text-right">
                            {formatEuro(product.quantity * product.unitPrice)}
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {formatEuro(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 lg:p-6">
        <div className="container-responsive">
          <div className="flex space-x-4">
            {step === 1 ? (
              <>
                <Link href="/orders" className="btn btn-secondary flex-1 lg:flex-none lg:px-8">
                  Cancel
                </Link>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="btn btn-primary btn-lg flex-1 lg:flex-none lg:px-8"
                >
                  Next: Add Products
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-secondary flex-1 lg:flex-none lg:px-8"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canSubmit}
                  className="btn btn-primary btn-lg flex-1 lg:flex-none lg:px-8"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Creating Job...
                    </>
                  ) : (
                    <>
                      Create Job
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
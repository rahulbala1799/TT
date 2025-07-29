import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderItems: true,
        statuses: {
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating order with data:', body)
    
    const { 
      clientName, 
      clientEmail, 
      clientPhone,
      clientCompany,
      title, 
      description,
      priority,
      dueDate,
      products,
      initialStatuses = ['ENQUIRY'] // Default starting status
    } = body

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `PO${String(orderCount + 1).padStart(6, '0')}`

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: clientEmail || 'unknown@example.com' }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: clientName || 'Unknown Customer',
          email: clientEmail || 'unknown@example.com',
          phone: clientPhone || null,
          company: clientCompany || null
        }
      })
    }

    // Find a user (for now, use the first user or create a dummy one)
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@printtrack.com',
          name: 'Print Track Admin'
        }
      })
    }

    // Calculate totals from products
    const orderItems = products?.map((product: any) => ({
      name: product.name || 'Custom Print Job',
      description: product.description || '',
      quantity: product.quantity || 1,
      unitPrice: product.price || 0,
      totalPrice: (product.quantity || 1) * (product.price || 0)
    })) || []

    const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1
    const totalPrice = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
    const unitPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0

    console.log('Order calculations:', { totalQuantity, totalPrice, unitPrice, orderItems })

    // Create order with multiple statuses
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        userId: user.id,
        title: title || 'New Print Job',
        description: description || '',
        quantity: totalQuantity,
        unitPrice,
        totalPrice,
        priority: priority || 'NORMAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        orderItems: {
          create: orderItems
        },
        statuses: {
          create: initialStatuses.map((status: string) => ({
            status,
            isActive: true,
            notes: `Initial status: ${status}`
          }))
        },
        statusLogs: {
          create: initialStatuses.map((status: string) => ({
            status,
            action: 'ADDED',
            notes: `Order created with status: ${status}`
          }))
        }
      },
      include: {
        customer: true,
        orderItems: true,
        statuses: {
          where: {
            isActive: true
          }
        }
      }
    })

    console.log('Order created successfully:', order.id)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Detailed error creating order:', error)
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
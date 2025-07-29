import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
        },
        statusLogs: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT /api/orders/[id] - Update an order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      priority,
      dueDate,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      products,
      statusesToAdd = [],
      statusesToRemove = []
    } = body

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { customer: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update customer if provided
    let customer = existingOrder.customer
    if (clientName || clientEmail || clientPhone || clientCompany) {
      customer = await prisma.customer.update({
        where: { id: existingOrder.customerId },
        data: {
          ...(clientName && { name: clientName }),
          ...(clientEmail && { email: clientEmail }),
          ...(clientPhone && { phone: clientPhone }),
          ...(clientCompany && { company: clientCompany })
        }
      })
    }

    // Calculate new totals if products provided
    let updateData: any = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
    }

    if (products && products.length > 0) {
      const orderItems = products.map((product: any) => ({
        name: product.name || 'Custom Print Job',
        description: product.description || '',
        quantity: product.quantity || 1,
        unitPrice: product.price || 0,
        totalPrice: (product.quantity || 1) * (product.price || 0)
      }))

      const totalQuantity = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1
      const totalPrice = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const unitPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0

      updateData = {
        ...updateData,
        quantity: totalQuantity,
        unitPrice,
        totalPrice
      }
    }

    // Start transaction to update order and manage statuses
    const result = await prisma.$transaction(async (tx) => {
      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: updateData
      })

      // Remove statuses
      if (statusesToRemove.length > 0) {
        await tx.orderStatus.updateMany({
          where: {
            orderId: params.id,
            status: { in: statusesToRemove }
          },
          data: { isActive: false }
        })

        // Log status removals
        await tx.orderStatusLog.createMany({
          data: statusesToRemove.map((status: string) => ({
            orderId: params.id,
            status,
            action: 'REMOVED',
            notes: 'Status removed during order update'
          }))
        })
      }

      // Add new statuses
      if (statusesToAdd.length > 0) {
        // Create new statuses (use upsert to handle duplicates)
        for (const status of statusesToAdd) {
          await tx.orderStatus.upsert({
            where: {
              orderId_status: {
                orderId: params.id,
                status
              }
            },
            update: {
              isActive: true,
              notes: 'Status reactivated during order update'
            },
            create: {
              orderId: params.id,
              status,
              isActive: true,
              notes: 'Status added during order update'
            }
          })
        }

        // Log status additions
        await tx.orderStatusLog.createMany({
          data: statusesToAdd.map((status: string) => ({
            orderId: params.id,
            status,
            action: 'ADDED',
            notes: 'Status added during order update'
          }))
        })
      }

      // Update order items if products provided
      if (products && products.length > 0) {
        // Delete existing order items
        await tx.orderItem.deleteMany({
          where: { orderId: params.id }
        })

        // Create new order items
        await tx.orderItem.createMany({
          data: products.map((product: any) => ({
            orderId: params.id,
            name: product.name || 'Custom Print Job',
            description: product.description || '',
            quantity: product.quantity || 1,
            unitPrice: product.price || 0,
            totalPrice: (product.quantity || 1) * (product.price || 0)
          }))
        })
      }

      return updatedOrder
    })

    // Fetch the updated order with all relations
    const finalOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        orderItems: true,
        statuses: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(finalOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ 
      error: 'Failed to update order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/orders/[id] - Cancel/Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'cancel' // 'cancel' or 'delete'

    if (action === 'cancel') {
      // Cancel the order by adding CANCELLED status and deactivating others
      await prisma.$transaction(async (tx) => {
        // Deactivate all current statuses
        await tx.orderStatus.updateMany({
          where: {
            orderId: params.id,
            isActive: true
          },
          data: { isActive: false }
        })

        // Add CANCELLED status
        await tx.orderStatus.create({
          data: {
            orderId: params.id,
            status: 'CANCELLED',
            isActive: true,
            notes: 'Order cancelled by user'
          }
        })

        // Log the cancellation
        await tx.orderStatusLog.create({
          data: {
            orderId: params.id,
            status: 'CANCELLED',
            action: 'ADDED',
            notes: 'Order cancelled by user'
          }
        })
      })

      // Return the updated order
      const cancelledOrder = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          customer: true,
          orderItems: true,
          statuses: {
            where: { isActive: true }
          }
        }
      })

      return NextResponse.json(cancelledOrder)
    } else {
      // Permanently delete the order
      await prisma.order.delete({
        where: { id: params.id }
      })

      return NextResponse.json({ message: 'Order deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting/cancelling order:', error)
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
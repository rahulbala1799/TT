import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { statuses } = await request.json()
    const orderId = params.id

    // First, deactivate all current statuses
    await prisma.orderStatus.updateMany({
      where: { orderId },
      data: { isActive: false }
    })

    // Then, activate the selected statuses
    const statusUpdates = statuses.map((status: string) => ({
      orderId,
      status,
      isActive: true,
      notes: `Status updated to ${status}`
    }))

    // Create or update statuses
    for (const statusUpdate of statusUpdates) {
      await prisma.orderStatus.upsert({
        where: {
          orderId_status: {
            orderId: statusUpdate.orderId,
            status: statusUpdate.status
          }
        },
        update: {
          isActive: true,
          notes: statusUpdate.notes
        },
        create: statusUpdate
      })
    }

    // Log the status change
    for (const status of statuses) {
      await prisma.orderStatusLog.create({
        data: {
          orderId,
          status,
          action: 'ADDED',
          notes: `Status updated to ${status}`
        }
      })
    }

    // Fetch updated order with statuses
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        statuses: true,
        customer: true
      }
    })

    return NextResponse.json(updatedOrder?.statuses || [])
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
} 
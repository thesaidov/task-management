// src/app/api/friends/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PUT - Accept or Reject a friend request
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body // ACCEPTED or REJECTED

    if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be ACCEPTED or REJECTED" },
        { status: 400 }
      )
    }

    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      )
    }

    // Only the receiver can accept/reject
    if (friendship.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only accept or reject requests sent to you" },
        { status: 403 }
      )
    }

    // Only pending requests can be acted upon
    if (friendship.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is no longer pending" },
        { status: 400 }
      )
    }

    const updated = await prisma.friendship.update({
      where: { id: params.id },
      data: { status },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating friend request:", error)
    return NextResponse.json(
      { error: "Failed to update friend request" },
      { status: 500 }
    )
  }
}

// DELETE - Remove a friend (unfriend)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 }
      )
    }

    // Only sender or receiver can unfriend
    if (
      friendship.senderId !== session.user.id &&
      friendship.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    await prisma.friendship.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Friend removed successfully" })
  } catch (error) {
    console.error("Error removing friend:", error)
    return NextResponse.json(
      { error: "Failed to remove friend" },
      { status: 500 }
    )
  }
}
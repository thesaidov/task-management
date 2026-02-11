// src/app/api/friends/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all friends (accepted) and pending requests
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all friendships involving this user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Categorize friendships
    const friends = friendships
      .filter((f) => f.status === "ACCEPTED")
      .map((f) => ({
        id: f.id,
        status: f.status,
        friend: f.senderId === userId ? f.receiver : f.sender,
      }))

    const pendingSent = friendships
      .filter((f) => f.status === "PENDING" && f.senderId === userId)
      .map((f) => ({
        id: f.id,
        status: f.status,
        friend: f.receiver,
      }))

    const pendingReceived = friendships
      .filter((f) => f.status === "PENDING" && f.receiverId === userId)
      .map((f) => ({
        id: f.id,
        status: f.status,
        friend: f.sender,
      }))

    return NextResponse.json({ friends, pendingSent, pendingReceived })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    )
  }
}

// POST - Send a friend request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Cannot add yourself
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself as a friend" },
        { status: 400 }
      )
    }

    // Check if friendship already exists (any direction)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: session.user.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Already friends" },
          { status: 400 }
        )
      }
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "Friend request already sent" },
          { status: 400 }
        )
      }
      // If REJECTED, delete and re-create
      if (existing.status === "REJECTED") {
        await prisma.friendship.delete({ where: { id: existing.id } })
      }
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: session.user.id,
        receiverId: targetUser.id,
        status: "PENDING",
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(friendship, { status: 201 })
  } catch (error) {
    console.error("Error sending friend request:", error)
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 }
    )
  }
}
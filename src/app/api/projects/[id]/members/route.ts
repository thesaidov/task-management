// src/app/api/projects/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all members of a project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}

// POST - Add a member to project
export async function POST(
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
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Only project owner can add members" },
        { status: 403 }
      )
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      )
    }

    // Check if user is already owner
    if (userToAdd.id === project.userId) {
      return NextResponse.json(
        { error: "User is already the project owner" },
        { status: 400 }
      )
    }

    // ✅ Check if the target user is a friend of the project owner
    const isFriend = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: session.user.id, receiverId: userToAdd.id },
          { senderId: userToAdd.id, receiverId: session.user.id },
        ],
      },
    })

    if (!isFriend) {
      return NextResponse.json(
        { error: "You can only add friends as project members" },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: userToAdd.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        projectId: params.id,
        userId: userToAdd.id,
        role: "MEMBER",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    )
  }
}

// DELETE - Remove a member from project
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

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      )
    }

    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Only project owner can remove members" },
        { status: 403 }
      )
    }

    await prisma.projectMember.delete({
      where: {
        id: memberId,
      },
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    )
  }
}
// src/app/api/my-tasks/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET - Get all tasks assigned to the logged-in user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching tasks for user:", session.user.id)

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log("Found tasks:", tasks.length)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching my tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}
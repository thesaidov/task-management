// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assignedToId } =
      body;

    // Verify task exists and user has access to its project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
      },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access (owner or member)
    const hasAccess =
      existingTask.project.userId === session.user.id ||
      existingTask.project.members.some((m) => m.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If assignedToId is being changed, verify new assignee is a member
    if (assignedToId !== undefined && assignedToId !== null) {
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: existingTask.projectId,
          userId: assignedToId,
        },
      });

      const isOwner = existingTask.project.userId === assignedToId;

      if (!isMember && !isOwner) {
        return NextResponse.json(
          { error: "Assigned user is not a project member" },
          { status: 400 },
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: {
        title:
          title !== undefined
            ? title?.trim() || existingTask.title
            : existingTask.title,
        description:
          description !== undefined
            ? description?.trim() || null
            : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
        priority: priority !== undefined ? priority : existingTask.priority,
        dueDate:
          dueDate !== undefined
            ? dueDate
              ? new Date(dueDate)
              : null
            : existingTask.dueDate,
        assignedToId:
          assignedToId !== undefined
            ? assignedToId || null
            : existingTask.assignedToId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

// DELETE - Delete one of my tasks
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // const taskId = searchParams.get("id");
    const taskId = await params;

    console.log(
      "Deleting task with ID:",
      taskId.id,
      "for user:",
      session.user.id,
    );

    if (!taskId.id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    // Make sure the task belongs to the logged-in user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId.id,
        creatorId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 },
      );
    }

    await prisma.task.delete({
      where: {
        id: taskId.id,
      },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

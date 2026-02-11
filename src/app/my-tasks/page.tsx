"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Task, TaskStatus } from "@/types";

export default function MyTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchMyTasks();
  }, [status, router]);

  const fetchMyTasks = async () => {
    try {
      console.log("Fetching my tasks...");
      const res = await fetch("/api/my-tasks");
      console.log("Response status:", res.status);

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        console.log("Received tasks:", data);
        setTasks(data);
      } else {
        const error = await res.json();
        console.error("Error response:", error);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/my-tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = tasks.filter((t) => filter === "ALL" || t.status === filter);

  const counts = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const statusColors: Record<TaskStatus, string> = {
    TODO: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    DONE: "bg-green-100 text-green-800",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-gray-500",
    MEDIUM: "text-yellow-600",
    HIGH: "text-red-600",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-900">{counts.TODO}</p>
            <p className="text-sm text-blue-700">To Do</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-yellow-900">
              {counts.IN_PROGRESS}
            </p>
            <p className="text-sm text-yellow-700">In Progress</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-900">{counts.DONE}</p>
            <p className="text-sm text-green-700">Done</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s === "ALL"
                ? "All"
                : s === "IN_PROGRESS"
                  ? "In Progress"
                  : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-5xl mb-3">📋</p>
              <p className="text-gray-500">
                {tasks.length === 0
                  ? "No tasks assigned to you yet"
                  : `No tasks with status "${filter}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((task) => (
                <div key={task.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}
                        >
                          {task.status === "IN_PROGRESS"
                            ? "In Progress"
                            : task.status.charAt(0) +
                              task.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`font-medium ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.project && (
                        <Link
                          href={`/projects/${task.project.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          📁 {task.project.name}
                        </Link>
                      )}
                    </div>

                    {/* Status Changer */}
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(
                          task.id,
                          e.target.value as TaskStatus,
                        )
                      }
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

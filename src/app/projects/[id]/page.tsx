"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  ProjectMember,
} from "@/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const [projectRes, membersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/members`),
      ]);

      if (projectRes.ok) {
        const data = await projectRes.json();
        setProject(data);
      } else if (projectRes.status === 404) {
        router.push("/dashboard");
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const filteredTasks =
    project?.tasks?.filter((task) =>
      filter === "ALL" ? true : task.status === filter,
    ) || [];

  const tasksByStatus = {
    TODO: project?.tasks?.filter((t) => t.status === "TODO").length || 0,
    IN_PROGRESS:
      project?.tasks?.filter((t) => t.status === "IN_PROGRESS").length || 0,
    DONE: project?.tasks?.filter((t) => t.status === "DONE").length || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                {project.name}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMembersModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                👥 Members ({members.length})
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h2>
          <p className="text-gray-600">
            {project.description || "No description provided"}
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {tasksByStatus.TODO}
            </div>
            <div className="text-sm text-blue-700">To Do</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">
              {tasksByStatus.IN_PROGRESS}
            </div>
            <div className="text-sm text-yellow-700">In Progress</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {tasksByStatus.DONE}
            </div>
            <div className="text-sm text-green-700">Done</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 rounded text-sm ${
                  filter === "ALL"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("TODO")}
                className={`px-3 py-1 rounded text-sm ${
                  filter === "TODO"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                To Do
              </button>
              <button
                onClick={() => setFilter("IN_PROGRESS")}
                className={`px-3 py-1 rounded text-sm ${
                  filter === "IN_PROGRESS"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter("DONE")}
                className={`px-3 py-1 rounded text-sm ${
                  filter === "DONE"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Done
              </button>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
            >
              + Add Task
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-2">📝</div>
              <p>
                No tasks {filter !== "ALL" ? `with status "${filter}"` : "yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setShowTaskModal(true);
                  }}
                  onDelete={handleDeleteTask}
                  onStatusChange={(taskId, status) => {
                    fetch(`/api/my-tasks/${taskId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status }),
                    }).then(() => fetchProject());
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchProject();
            setShowEditModal(false);
          }}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          projectName={project.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          members={members}
          projectOwnerId={project.userId}
          projectOwnerName={session?.user?.name || "Owner"}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            fetchProject();
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {showMembersModal && (
        <MembersModal
          projectId={projectId}
          members={members}
          isOwner={project.userId === session?.user?.id}
          onClose={() => setShowMembersModal(false)}
          onSuccess={() => {
            fetchProject();
          }}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const statusColors = {
    TODO: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DONE: "bg-green-100 text-green-800 border-green-200",
  };

  const priorityColors = {
    LOW: "text-gray-600",
    MEDIUM: "text-yellow-600",
    HIGH: "text-red-600",
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(task)}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-900 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <select
          value={task.status}
          onChange={(e) =>
            onStatusChange(task.id, e.target.value as TaskStatus)
          }
          className={`px-2 py-1 rounded border ${statusColors[task.status]}`}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        <span className={`font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="text-gray-500">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function TaskModal({
  projectId,
  task,
  members,
  projectOwnerId,
  projectOwnerName,
  onClose,
  onSuccess,
}: {
  projectId: string;
  task: Task | null;
  members: ProjectMember[];
  projectOwnerId: string;
  projectOwnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority || "MEDIUM",
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );
  const [assignedToId, setAssignedToId] = useState<string>(
    task?.assignedToId || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Build assignable users - include owner + members
  const assignableUsers = [
    { id: projectOwnerId, name: `${projectOwnerName} (Owner)`, email: "" },
    ...members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = task ? `/api/my-tasks/${task.id}` : "/api/my-tasks";
      const method = task ? "PUT" : "POST";
      console.log(assignedToId);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          dueDate: dueDate || null,
          projectId,
          assignedToId: assignedToId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save task");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {task ? "Edit Task" : "Create New Task"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assign To - only from project members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Add members to the project to assign tasks to them
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({
  projectId,
  members,
  isOwner,
  onClose,
  onSuccess,
}: {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add member");
        return;
      }

      setEmail("");
      onSuccess();
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: "DELETE" },
      );
      if (res.ok) onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Project Members</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Add member form - only for owners */}
        {isOwner && (
          <form onSubmit={handleAddMember} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Friend by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@email.com"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? "..." : "Add"}
              </button>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
              You can only add people who are your friends.
            </p>
          </form>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">
              No members yet. Add friends to collaborate!
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {m.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{m.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {m.role}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update project");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Project</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  projectName,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Project</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{projectName}</strong>? This
          action cannot be undone and will also delete all tasks in this
          project.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

// src/__tests__/components/TaskCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Task } from "@/types";

// Mock TaskCard component for testing
function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusColors = {
    TODO: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    DONE: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="border rounded-lg p-4" data-testid="task-card">
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
            data-testid="edit-button"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-900 text-sm"
            data-testid="delete-button"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`px-2 py-1 rounded border ${statusColors[task.status]}`}
          data-testid="status-select"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        <span className="font-medium">{task.priority}</span>

        {task.dueDate && (
          <span className="text-gray-500">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

describe("TaskCard", () => {
  const mockTask: Task = {
    id: "1",
    title: "Test Task",
    description: "Test Description",
    status: "TODO",
    priority: "HIGH",
    dueDate: new Date("2024-12-31"),
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "project-1",
    assignedToId: "user-1",
  };

  it("renders task information correctly", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    const editButton = screen.getByTestId("edit-button");
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTask);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    const deleteButton = screen.getByTestId("delete-button");
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith("1");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onStatusChange when status is changed", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    const statusSelect = screen.getByTestId("status-select");
    fireEvent.change(statusSelect, { target: { value: "IN_PROGRESS" } });

    expect(onStatusChange).toHaveBeenCalledWith("1", "IN_PROGRESS");
  });

  it("renders due date when provided", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const taskWithoutDescription = { ...mockTask, description: null };
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={taskWithoutDescription}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
  });
});

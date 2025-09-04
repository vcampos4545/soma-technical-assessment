"use client";
import { useState, useEffect } from "react";
import {
  TaskGraph,
  CriticalPathResult,
  GraphVisualization,
  buildTaskGraph,
  wouldCauseCycle,
  calculateCriticalPath,
  calculateEarliestStartDates,
  generateGraphVisualization,
} from "@/lib/graph";
import { Todo } from "@prisma/client";

export default function Home() {
  const [newTodo, setNewTodo] = useState<{
    title: string;
    dueDate: string;
    dependencies: number[];
  }>({
    title: "",
    dueDate: "",
    dependencies: [],
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [graph, setGraph] = useState<TaskGraph>({});
  const [criticalPath, setCriticalPath] = useState<CriticalPathResult>({
    criticalPath: [],
    maxDistance: 0,
  });
  const [earliestStartDates, setEarliestStartDates] = useState<
    Record<number, number>
  >({});
  const [graphVisualization, setGraphVisualization] =
    useState<GraphVisualization>({ nodes: [], edges: [] });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    dueDate: string;
    dependencies: number[];
  }>({
    title: "",
    dueDate: "",
    dependencies: [],
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const formatDate = (date: Date) => {
    // Ensure we're working with the local date by creating a new date with just the date components
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return localDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0); // Reset to start of day

    return due < today;
  };

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      console.log(data);
      setTodos(data);

      // Build adjacency list (graph) for quick traversal
      const graphData = buildTaskGraph(data);

      setGraph(graphData);
      console.log("Task dependency graph:", graphData);

      // Calculate critical path, earliest start dates, and visualization data
      const criticalPathData = calculateCriticalPath(graphData, data);
      const earliestStartDatesData = calculateEarliestStartDates(
        graphData,
        data
      );
      const visualizationData = generateGraphVisualization(graphData, data);

      setCriticalPath(criticalPathData);
      setEarliestStartDates(earliestStartDatesData);
      setGraphVisualization(visualizationData);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const handleDependencyChange = (todoId: number, checked: boolean) => {
    if (checked) {
      setNewTodo((prev) => ({
        ...prev,
        dependencies: [...prev.dependencies, todoId],
      }));
    } else {
      setNewTodo((prev) => ({
        ...prev,
        dependencies: prev.dependencies.filter((id) => id !== todoId),
      }));
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;
    if (!newTodo.dueDate) return;

    // Check if would create a circular dependency
    if (newTodo.dependencies.length > 0) {
      // For each dependency, check if it would cause a cycle
      // We'll need to simulate adding this new todo to the graph first
      const tempGraph = { ...graph };
      const newTodoId = Math.max(...Object.keys(graph).map(Number), 0) + 1; // Simulate new ID

      for (const dependencyId of newTodo.dependencies) {
        if (wouldCauseCycle(tempGraph, newTodoId, dependencyId)) {
          alert("Adding this dependency would create a circular dependency!");
          return;
        }
      }
    }

    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });
      setNewTodo({ title: "", dueDate: "", dependencies: [] });
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      dueDate: new Date(todo.dueDate).toISOString().split("T")[0],
      dependencies: [],
    });

    // Parse existing dependencies
    try {
      const deps = JSON.parse(todo.dependencies || "[]");
      setEditForm((prev) => ({ ...prev, dependencies: deps }));
    } catch (error) {
      console.error("Error parsing dependencies for edit", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setEditForm({
      title: "",
      dueDate: "",
      dependencies: [],
    });
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo) return;
    if (!editForm.title.trim()) return;
    if (!editForm.dueDate) return;

    // Check if would create a circular dependency
    if (editForm.dependencies.length > 0) {
      const tempGraph = { ...graph };
      // Remove the current todo from the graph temporarily
      delete tempGraph[editingTodo.id];

      for (const dependencyId of editForm.dependencies) {
        if (wouldCauseCycle(tempGraph, editingTodo.id, dependencyId)) {
          alert("Adding this dependency would create a circular dependency!");
          return;
        }
      }
    }

    try {
      // Ensure date is handled consistently by parsing it as local date
      const [year, month, day] = editForm.dueDate.split("-").map(Number);
      const dueDateObj = new Date(year, month - 1, day, 12, 0, 0, 0);

      await fetch(`/api/todos/${editingTodo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          dueDate: dueDateObj.toISOString(),
          dependencies: editForm.dependencies,
        }),
      });

      setEditingTodo(null);
      setEditForm({
        title: "",
        dueDate: "",
        dependencies: [],
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleEditDependencyChange = (todoId: number, checked: boolean) => {
    if (checked) {
      setEditForm((prev) => ({
        ...prev,
        dependencies: [...prev.dependencies, todoId],
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        dependencies: prev.dependencies.filter((id) => id !== todoId),
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-black mb-4">
            Add New Todo:
          </h3>

          <div className="space-y-4">
            {/* Title and Due Date Row */}
            <div className="flex space-x-3">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                placeholder="Add a new todo"
                value={newTodo.title}
                onChange={(e) =>
                  setNewTodo({ ...newTodo, title: e.target.value })
                }
              />
              <input
                type="date"
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                value={newTodo.dueDate}
                onChange={(e) =>
                  setNewTodo({ ...newTodo, dueDate: e.target.value })
                }
              />
              <button
                onClick={handleAddTodo}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Add
              </button>
            </div>

            {/* Dependencies Selection */}
            {todos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-black mb-3">
                  Dependencies (optional):
                </h4>
                <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {todos.map((todo) => (
                    <label
                      key={todo.id}
                      className="flex items-center space-x-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={newTodo.dependencies.includes(todo.id)}
                        onChange={(e) =>
                          handleDependencyChange(todo.id, e.target.checked)
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-black truncate">{todo.title}</span>
                    </label>
                  ))}
                </div>
                {newTodo.dependencies.length > 0 && (
                  <div className="mt-3 text-sm text-black bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="font-medium">Selected dependencies:</span>{" "}
                    {newTodo.dependencies
                      .map((id) => todos.find((t) => t.id === id)?.title)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Todo Modal Overlay */}
        {editingTodo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Edit Todo
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title:
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Edit todo title"
                    />
                  </div>

                  {/* Due Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date:
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editForm.dueDate}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Dependencies Selection */}
                  {todos.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dependencies:
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {todos
                          .filter((t) => t.id !== editingTodo.id) // Exclude self from dependencies
                          .map((todo) => (
                            <label
                              key={todo.id}
                              className="flex items-center space-x-3 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={editForm.dependencies.includes(
                                  todo.id
                                )}
                                onChange={(e) =>
                                  handleEditDependencyChange(
                                    todo.id,
                                    e.target.checked
                                  )
                                }
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700 truncate">
                                {todo.title}
                              </span>
                            </label>
                          ))}
                      </div>
                      {editForm.dependencies.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          Selected:{" "}
                          {editForm.dependencies
                            .map((id) => todos.find((t) => t.id === id)?.title)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUpdateTodo}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                    >
                      Update Todo
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Analysis Section */}
        {todos.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Project Analysis
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Critical Path */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-purple-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Critical Path
                </h4>
                <div className="text-sm text-purple-900">
                  {criticalPath.criticalPath.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {criticalPath.criticalPath.map((taskId, index) => {
                          const task = todos.find((t) => t.id === taskId);
                          return (
                            <span
                              key={taskId}
                              className="inline-flex items-center"
                            >
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                                {task?.title || `Task ${taskId}`}
                              </span>
                              {index < criticalPath.criticalPath.length - 1 && (
                                <svg
                                  className="w-4 h-4 mx-2 text-purple-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 px-3 py-2 rounded-lg border border-purple-200">
                        <span className="font-semibold">Path Length:</span>{" "}
                        {criticalPath.maxDistance} steps
                      </div>
                    </div>
                  ) : (
                    <div className="text-purple-700 bg-purple-100 px-3 py-2 rounded-lg border border-purple-200">
                      No dependencies - all tasks can be done in parallel
                    </div>
                  )}
                </div>
              </div>

              {/* Earliest Start Dates */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Execution Order
                </h4>
                <div className="space-y-2">
                  {Object.entries(earliestStartDates)
                    .sort(([, a], [, b]) => a - b)
                    .map(([taskId, startDate]) => {
                      const task = todos.find((t) => t.id === parseInt(taskId));
                      return (
                        <div
                          key={taskId}
                          className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm"
                        >
                          <span className="text-sm font-medium text-blue-900">
                            {task?.title || `Task ${taskId}`}
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-semibold border border-blue-200">
                            Step {startDate}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Graph Visualization */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Dependency Levels
                </h4>
                <div className="space-y-3">
                  {graphVisualization.nodes
                    .sort((a, b) => a.level - b.level)
                    .map((node) => (
                      <div
                        key={node.id}
                        className="p-3 bg-white rounded-lg border border-green-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full border border-green-200">
                            Level {node.level}
                          </span>
                          <span className="text-sm font-semibold text-green-900">
                            {node.label}
                          </span>
                        </div>
                        {node.dependencies.length > 0 && (
                          <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                            <span className="font-medium">Dependencies:</span>{" "}
                            {node.dependencies
                              .map((depId: number) => {
                                const depTask = todos.find(
                                  (t) => t.id === depId
                                );
                                return depTask?.title || `Task ${depId}`;
                              })
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <ul>
          {todos.map((todo: Todo) => (
            <li
              key={todo.id}
              className="bg-white bg-opacity-95 backdrop-blur-sm p-6 mb-6 rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">
                    {todo.title}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00-2-2V7a2 2 0 002 2z"
                        />
                      </svg>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                          isOverdue(new Date(todo.dueDate))
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {formatDate(new Date(todo.dueDate))}
                      </span>
                    </div>

                    {/* Dependencies indicator */}
                    {(() => {
                      try {
                        const deps = JSON.parse(todo.dependencies || "[]");
                        if (Array.isArray(deps) && deps.length > 0) {
                          return (
                            <div className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="text-xs text-gray-500">
                                {deps.length} dep
                                {deps.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error parsing dependencies for display",
                          error
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTodo(todo)}
                    className="text-gray-400 hover:text-blue-500 transition-colors duration-200 p-2 hover:bg-blue-50 rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 hover:bg-red-50 rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {todo.imageUrl && (
                <div className="mt-4">
                  <img
                    src={todo.imageUrl}
                    alt={`Image for ${todo.title}`}
                    className="w-full h-40 object-cover rounded-lg shadow-md"
                    onLoad={(e) => {
                      e.currentTarget.style.display = "block";
                      e.currentTarget.previousElementSibling?.remove();
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.previousElementSibling?.remove();
                    }}
                  />
                </div>
              )}

              {/* Dependencies List */}
              {(() => {
                try {
                  const deps = JSON.parse(todo.dependencies || "[]");
                  if (Array.isArray(deps) && deps.length > 0) {
                    return (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <svg
                            className="w-4 h-4 text-gray-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Dependencies ({deps.length}):
                        </h4>
                        <div className="space-y-1">
                          {deps.map((depId) => {
                            const depTodo = todos.find((t) => t.id === depId);
                            return (
                              <div
                                key={depId}
                                className="flex items-center text-sm text-gray-600 bg-white px-2 py-1 rounded border border-gray-100"
                              >
                                <svg
                                  className="w-3 h-3 text-gray-400 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                                {depTodo ? depTodo.title : `Task ${depId}`}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  console.error("Error parsing dependencies for list", error);
                }
                return null;
              })()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

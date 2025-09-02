"use client";
import { Todo } from "@prisma/client";
import { useState, useEffect } from "react";

export default function Home() {
  const [newTodo, setNewTodo] = useState<{ title: string; dueDate: string }>({
    title: "",
    dueDate: "",
  });
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
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
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;
    if (!newTodo.dueDate) return;
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });
      setNewTodo({ title: "", dueDate: "" });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
          />
          <input
            type="date"
            value={newTodo.dueDate}
            onChange={(e) =>
              setNewTodo({ ...newTodo, dueDate: e.target.value })
            }
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                  </div>
                </div>
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

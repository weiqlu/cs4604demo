import { useState, useEffect } from "react";
import "./Dashboard.css";

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

function Dashboard({ username, onLogout }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
  });
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // In a real app, this would come from authentication token
        // For demo purposes, we'll fetch by username
        const response = await fetch("http://localhost:3000/api/users");
        const users = await response.json();
        const user = users.find((u: any) => u.username === username);
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error("Error fetching user ID:", err);
      }
    };
    fetchUserId();
  }, [username]);

  // Fetch tasks and stats when userId changes
  useEffect(() => {
    if (userId) {
      fetchTasks();
      fetchStats();
    }
  }, [userId, filter]);

  const fetchTasks = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      let url = `http://localhost:3000/api/tasks/user/${userId}`;

      if (filter === "completed") {
        url += "?completed=true";
      } else if (filter === "pending") {
        url += "?completed=false";
      }

      const response = await fetch(url);
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError("Failed to fetch tasks");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/tasks/user/${userId}/stats`
      );
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newTask.title.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: newTask.title,
          description: newTask.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      setNewTask({ title: "", description: "" });
      setShowModal(false);
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      setError("Failed to create task");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/tasks/${task.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !task.completed }),
        }
      );

      if (!response.ok) throw new Error("Failed to update task");

      await fetchTasks();
      await fetchStats();
    } catch (err) {
      setError("Failed to update task");
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete task");

      await fetchTasks();
      await fetchStats();
    } catch (err) {
      setError("Failed to delete task");
      console.error(err);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditForm({ title: task.title, description: task.description || "" });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: "", description: "" });
  };

  const handleSaveEdit = async (taskId: number) => {
    if (!editForm.title.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) throw new Error("Failed to update task");

      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      setError("Failed to update task");
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Task Manager</h1>
            <p className="welcome-text">Welcome, {username}!</p>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.total_tasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending_tasks}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed_tasks}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Filter Buttons */}
        <div className="filter-section">
          <h2>Your Tasks</h2>
          <div className="filter-actions">
            <button onClick={() => setShowModal(true)} className="btn-new-task">
              + Create New Task
            </button>
            <div className="filter-buttons">
              <button
                onClick={() => setFilter("all")}
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`filter-btn ${filter === "pending" ? "active" : ""}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`filter-btn ${
                  filter === "completed" ? "active" : ""
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="tasks-container">
          {isLoading ? (
            <p className="loading-text">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-text">
              No tasks yet. Create your first task above!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? "completed" : ""}`}
              >
                {editingTask === task.id ? (
                  // Edit Mode
                  <div className="task-edit-form">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="task-input"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      className="task-textarea"
                      rows={2}
                    />
                    <div className="task-edit-actions">
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="btn-save"
                      >
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="btn-cancel">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="task-content">
                      <div className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleComplete(task)}
                        />
                      </div>
                      <div className="task-info">
                        <h3 className="task-title">{task.title}</h3>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <p className="task-date">
                          Created:{" "}
                          {new Date(task.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="btn-edit"
                        disabled={task.completed}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-form">
              <div className="form-group">
                <label htmlFor="task-title">Task Title *</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  className="task-input"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-description">Description (optional)</label>
                <textarea
                  id="task-description"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="task-textarea"
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newTask.title.trim()}
                  className="btn-primary"
                >
                  {isLoading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

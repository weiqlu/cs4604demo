import "./Dashboard.css";

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

function Dashboard({ username, onLogout }: DashboardProps) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {username}!</h1>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
        <div className="dashboard-body">
          <p>You have successfully logged in.</p>
          <p className="placeholder-text">
            This is your main dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

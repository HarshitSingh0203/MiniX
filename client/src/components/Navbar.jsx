import { useAuth } from "../context/AuthContext";

function Navbar({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.history.pushState({}, "", "/login");
  };

  return (
    <header className="navbar">
      <button className="brand" onClick={() => onNavigate("home")}>
        <span>X</span> Mini X
      </button>

      <div className="navbar-user">
        <button onClick={() => onNavigate("profile", user.username)}>
          @{user.username}
        </button>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Navbar;

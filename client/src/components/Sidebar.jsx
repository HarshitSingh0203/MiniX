function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <button
        className={currentPage === "home" ? "active" : ""}
        onClick={() => onNavigate("home")}
      >
        <span>⌂</span> Home
      </button>
      <button
        className={currentPage === "explore" ? "active" : ""}
        onClick={() => onNavigate("explore")}
      >
        <span>⌕</span> Explore
      </button>
      <button
        className={currentPage === "profile" ? "active" : ""}
        onClick={() => onNavigate("profile")}
      >
        <span>○</span> Profile
      </button>
    </aside>
  );
}

export default Sidebar;

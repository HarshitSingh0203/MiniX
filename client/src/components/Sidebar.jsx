import "./Sidebar.css";

import {
  FaBolt,
  FaHome,
  FaSearch,
  FaRegCommentDots,
  FaRegBookmark,
  FaRegUser,
  FaCog,
  FaPlus,
  FaEllipsisH,
} from "react-icons/fa";

function Sidebar({ currentPage, onNavigate, user }) {
  const menuItems = [
    { page: "home", name: "Home", icon: <FaHome /> },
    { page: "explore", name: "Explore", icon: <FaSearch /> },
    { page: "chat", name: "Chat", icon: <FaRegCommentDots /> },
    { page: "bookmarks", name: "Bookmarks", icon: <FaRegBookmark /> },
    { page: "profile", name: "Profile", icon: <FaRegUser /> },
    { page: "settings", name: "Settings", icon: <FaCog /> },
  ];

  const avatar =
    user?.profilePhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "User"
    )}&background=5B2EFF&color=fff`;

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="logo">
        <FaBolt className="logo-icon" />
        <span>Instant</span>
      </div>

      {/* Menu */}
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.page}
            className={currentPage === item.page ? "active" : ""}
            onClick={() => onNavigate(item.page)}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      {/* Post Button */}
      <button
        className="post-btn"
        onClick={() => onNavigate("create")}
      >
        <FaPlus />
        <span>Post</span>
      </button>

      {/* User */}
      <div className="sidebar-user">
        <img src={avatar} alt="Profile" />

        <div className="user-info">
          <h4>{user?.name}</h4>
          <p>@{user?.username}</p>
        </div>

        <FaEllipsisH className="more-icon" />
      </div>

    </aside>
  );
}

export default Sidebar;
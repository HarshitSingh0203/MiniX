import { useEffect, useRef, useState } from "react";
import "./Sidebar.css";
import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/AuthContext";

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

function Sidebar({ currentPage, onNavigate, onPostClick, user }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Each menu item has a page name, label, and icon.
  const menuItems = [
    { page: "home", name: "Home", icon: <FaHome /> },
    { page: "explore", name: "Explore", icon: <FaSearch /> },
    { page: "chat", name: "Chat", icon: <FaRegCommentDots /> },
    { page: "bookmarks", name: "Bookmarks", icon: <FaRegBookmark /> },
    { page: "profile", name: "Profile", icon: <FaRegUser /> },
    { page: "settings", name: "Settings", icon: <FaCog /> },
  ];

  useEffect(() => {
    const closeMenu = (event) => {
      // Close the user menu when clicking outside it.
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    if (window.confirm("Log out of Instant?")) logout();
  };

  const toggleMenu = (event) => {
    event.stopPropagation();
    setMenuOpen((open) => !open);
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <FaBolt className="logo-icon" />
        <span>Instant</span>
      </div>

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

      <button className="post-btn" onClick={onPostClick}>
        <FaPlus />
        <span>Post</span>
      </button>

      <div className="sidebar-user-wrap" ref={menuRef}>
        <button
          className="sidebar-user"
          type="button"
          onClick={() => onNavigate("profile", user.username)}
        >
          <UserAvatar user={user} alt="Profile" />

          <span className="user-info">
            <strong>{user?.name}</strong>
            <small>@{user?.username}</small>
          </span>
        </button>

        <button
          className="sidebar-more"
          type="button"
          aria-label="Open user menu"
          onClick={toggleMenu}
        >
          <FaEllipsisH />
        </button>

        {menuOpen && (
          <div className="sidebar-user-menu">
            <button onClick={() => onNavigate("profile", user.username)}>View Profile</button>
            <button onClick={() => onNavigate("settings")}>Settings</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

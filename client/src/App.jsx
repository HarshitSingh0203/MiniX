import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import RightSidebar from "./components/RightSidebar";
import Sidebar from "./components/Sidebar";

import { useAuth } from "./context/AuthContext";
import Bookmarks from "./pages/Bookmarks";
import Chat from "./pages/Chat";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import "./App.css";

const getRoute = () => {
  const path = window.location.pathname;

  if (path === "/explore") return { page: "explore" };
  if (path === "/chat") return { page: "chat" };
  if (path === "/bookmarks") return { page: "bookmarks" };
  if (path === "/settings") return { page: "settings" };
  if (path.startsWith("/profile/")) {
    return { page: "profile", username: decodeURIComponent(path.split("/")[2]) };
  }
  return { page: "home" };
};

function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState(getRoute);
  const [authPage, setAuthPage] = useState(
    window.location.pathname === "/register" ? "register" : "login"
  );

  useEffect(() => {
    const handleBackButton = () => {
      if (window.location.pathname === "/register" || window.location.pathname === "/login") {
        setAuthPage(window.location.pathname.slice(1));
      } else {
        setRoute(getRoute());
      }
    };

    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, []);

  const switchAuthPage = (page) => {
    window.history.pushState({}, "", `/${page}`);
    setAuthPage(page);
  };

  const navigate = (page, username) => {
    let path = "/";
    if (page === "explore") path = "/explore";
    if (page === "chat") path = "/chat";
    if (page === "bookmarks") path = "/bookmarks";
    if (page === "settings") path = "/settings";
    if (page === "profile") path = `/profile/${username || user.username}`;

    window.history.pushState({}, "", path);
    setRoute({ page, username: username || user.username });
    window.scrollTo(0, 0);
  };

  const handleAuthSuccess = () => {
    window.history.pushState({}, "", "/");
    setRoute({ page: "home" });
  };

  if (!user) {
    return (
      <main className="auth-page">
        {authPage === "register" ? (
          <Register onSwitch={switchAuthPage} onSuccess={handleAuthSuccess} />
        ) : (
          <Login onSwitch={switchAuthPage} onSuccess={handleAuthSuccess} />
        )}
      </main>
    );
  }

  return (
    <div className="app">
      <Navbar onNavigate={navigate} />
      <div className="app-layout">
        <Sidebar currentPage={route.page} onNavigate={navigate} user={user} />

        <main className="main-column">
          {route.page === "explore" && <Explore onNavigate={navigate} />}
          {route.page === "chat" && <Chat onNavigate={navigate} />}
          {route.page === "bookmarks" && <Bookmarks onNavigate={navigate} />}
          {route.page === "settings" && <Settings />}
          {route.page === "profile" && (
            <Profile key={route.username} username={route.username} onNavigate={navigate} />
          )}
          {route.page === "home" && <Home onNavigate={navigate} />}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

export default App;

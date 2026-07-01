import { useEffect, useState } from "react";
import UserAvatar from "./UserAvatar";
import { getExploreData } from "../services/postApi";
import { searchUsers } from "../services/userApi";
import "./RightSidebar.css";

function RightSidebar({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [data, setData] = useState({
    popularUsers: [],
    trendingTopics: [],
    recentPosts: [],
  });

  useEffect(() => {
    // Reuse explore data for the small sidebar sections.
    getExploreData()
      .then(setData)
      .catch(() => {});
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setResults(await searchUsers(query));
  };

  const openProfile = (username) => {
    onNavigate("profile", username);
  };

  return (
    <aside className="right-sidebar">
      <form className="right-search" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
        />
      </form>

      {results.length > 0 && (
        <div className="side-card compact-card">
          <h3>Search results</h3>
          {results.map((person) => (
            <button key={person._id} onClick={() => openProfile(person.username)}>
              <UserAvatar as="span" className="avatar mini-avatar" user={person} />
              <span>
                <strong>{person.name}</strong>
                <small>@{person.username}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="side-card compact-card">
        <h3>Who to Follow</h3>
        {data.popularUsers.slice(0, 4).map((person) => (
          <button key={person._id} onClick={() => openProfile(person.username)}>
            <UserAvatar as="span" className="avatar mini-avatar" user={person} />
            <span>
              <strong>{person.name}</strong>
              <small>@{person.username}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="side-card">
        <h3>Trending Topics</h3>
        {data.trendingTopics.length === 0 && (
          <p><strong>#Instant</strong><br />Start a trend with your next post.</p>
        )}
        {data.trendingTopics.slice(0, 5).map((topic) => (
          <p key={topic.tag}>
            <strong>{topic.tag}</strong><br />
            {topic.count} posts
          </p>
        ))}
      </div>

      <div className="side-card latest-card">
        <h3>Latest Posts</h3>
        {data.recentPosts.slice(0, 4).map((post) => {
          const item = post.repostOf || post;
          return (
            <button key={post._id} onClick={() => openProfile(item.user?.username)}>
              <strong>@{item.user?.username}</strong>
              <span>{item.text || "Shared a post"}</span>
            </button>
          );
        })}
      </div>

      <small>Instant (c) 2026</small>
    </aside>
  );
}

export default RightSidebar;

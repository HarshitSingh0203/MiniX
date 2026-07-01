import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import UserAvatar from "../components/UserAvatar";
import { getExploreData, searchPosts } from "../services/postApi";
import { searchUsers } from "../services/userApi";
import "./Page.css";
import "./Explore.css";

function Explore({ onNavigate }) {
  const [explore, setExplore] = useState({
    trendingPosts: [],
    popularUsers: [],
    recentPosts: [],
    trendingTopics: [],
  });
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    // Load the first explore page data when the page opens.
    getExploreData()
      .then((data) => {
        if (!ignore) setExplore(data);
      })
      .catch((error) => {
        if (!ignore) setError(error.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      setError("");

      // Search users and posts at the same time.
      const [nextUsers, nextPosts] = await Promise.all([
        searchUsers(query),
        searchPosts(query),
      ]);
      setUsers(nextUsers);
      setPostResults(nextPosts);
    } catch (error) {
      setError(error.message);
    }
  };

  const renderUser = (person) => (
    <button key={person._id} onClick={() => onNavigate("profile", person.username)}>
      <UserAvatar as="span" className="avatar small-avatar" user={person} alt={person.name} />
      <span>
        <strong>{person.name}</strong>
        <small>@{person.username}</small>
      </span>
    </button>
  );

  const renderPost = (post) => (
    <PostCard
      key={post._id}
      post={post}
      onDelete={(id) => {
        // Remove deleted posts from every list on the explore page.
        setExplore((current) => ({
          ...current,
          trendingPosts: current.trendingPosts.filter((item) => item._id !== id),
          recentPosts: current.recentPosts.filter((item) => item._id !== id),
        }));
        setPostResults((current) => current.filter((item) => item._id !== id));
      }}
      onOpenProfile={(username) => onNavigate("profile", username)}
    />
  );

  return (
    <section className="page-content">
      <div className="page-title"><h1>Explore</h1></div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users or posts"
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="error-message list-message">{error}</p>}
      {loading && <p className="status-message">Loading explore...</p>}

      {(users.length > 0 || postResults.length > 0) && (
        <div className="explore-block">
          <h2>Search results</h2>
          {users.length > 0 && <div className="search-results">{users.map(renderUser)}</div>}
          {postResults.map(renderPost)}
        </div>
      )}

      {explore.popularUsers.length > 0 && (
        <div className="explore-block">
          <h2>Popular users</h2>
          <div className="search-results">{explore.popularUsers.map(renderUser)}</div>
        </div>
      )}

      {explore.trendingTopics.length > 0 && (
        <div className="topic-strip">
          {explore.trendingTopics.map((topic) => (
            <button key={topic.tag} onClick={() => setQuery(topic.tag)}>
              <strong>{topic.tag}</strong>
              <span>{topic.count} posts</span>
            </button>
          ))}
        </div>
      )}

      <h2 className="section-heading">Trending posts</h2>
      {!loading && explore.trendingPosts.length === 0 && (
        <p className="status-message">No trending posts yet.</p>
      )}
      {explore.trendingPosts.map(renderPost)}

      <h2 className="section-heading">Recent public posts</h2>
      {!loading && explore.recentPosts.length === 0 && (
        <p className="status-message">No posts to explore.</p>
      )}
      {explore.recentPosts.map(renderPost)}
    </section>
  );
}

export default Explore;

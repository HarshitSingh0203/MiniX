import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { getAllPosts } from "../services/postApi";
import { searchUsers } from "../services/userApi";
import { getImageUrl } from "../services/apiConfig";

function Explore({ onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllPosts().then(setPosts).catch((error) => setError(error.message));
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setUsers(await searchUsers(query));
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="page-content">
      <div className="page-title"><h1>Explore</h1></div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="error-message list-message">{error}</p>}

      {users.length > 0 && (
        <div className="search-results">
          {users.map((person) => (
            <button key={person._id} onClick={() => onNavigate("profile", person.username)}>
              <span className="avatar small-avatar">
                {person.profilePic ? (
                  <img src={getImageUrl(person.profilePic)} alt={person.name} />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </span>
              <span><strong>{person.name}</strong><small>@{person.username}</small></span>
            </button>
          ))}
        </div>
      )}

      <h2 className="section-heading">Latest posts</h2>
      {posts.length === 0 && !error && <p className="status-message">No posts to explore.</p>}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDelete={(id) => setPosts(posts.filter((item) => item._id !== id))}
          onOpenProfile={(username) => onNavigate("profile", username)}
        />
      ))}
    </section>
  );
}

export default Explore;

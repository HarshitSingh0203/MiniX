import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { getBookmarkedPosts } from "../services/postApi";
import "./Page.css";

function Bookmarks({ onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getBookmarkedPosts()
      .then((data) => {
        if (!ignore) setPosts(data);
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

  return (
    <section className="page-content">
      <div className="page-title"><h1>Bookmarks</h1></div>

      {loading && <p className="status-message">Loading saved posts...</p>}
      {error && <p className="error-message list-message">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="status-message">No bookmarks yet.</p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDelete={(id) => setPosts(posts.filter((item) => item._id !== id))}
          onBookmarkChange={(id, bookmarked) => {
            if (!bookmarked) setPosts(posts.filter((item) => item._id !== id));
          }}
          onOpenProfile={(username) => onNavigate("profile", username)}
        />
      ))}
    </section>
  );
}

export default Bookmarks;

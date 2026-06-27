import { useEffect, useState } from "react";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { getFeedPosts } from "../services/postApi";
import "./Page.css";

function Home({ onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPosts(await getFeedPosts());
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <section className="page-content">
      <div className="page-title"><h1>Home</h1></div>
      <CreatePost onCreated={(post) => setPosts([post, ...posts])} />

      {loading && <p className="status-message">Loading posts...</p>}
      {error && <p className="error-message list-message">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="status-message">No posts yet. Create your first post!</p>
      )}

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

export default Home;

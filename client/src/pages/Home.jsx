import { useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { getAllPosts, getFeedPosts } from "../services/postApi";
import "./Page.css";

function Home({ onNavigate }) {
  const [activeFeed, setActiveFeed] = useState("forYou");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const nextPosts = await getPostsForFeed(activeFeed);

        if (!ignore) setPosts(nextPosts);
      } catch (error) {
        if (!ignore) setError(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadPosts();

    return () => {
      ignore = true;
    };
  }, [activeFeed]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      setPosts(await getPostsForFeed(activeFeed));
    } catch (error) {
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleCreatedPost = (event) => {
      const post = event.detail;
      if (!post) return;

      setPosts((currentPosts) => {
        if (currentPosts.some((item) => item._id === post._id)) {
          return currentPosts;
        }

        return [post, ...currentPosts];
      });
    };

    window.addEventListener("instant:post-created", handleCreatedPost);
    return () => window.removeEventListener("instant:post-created", handleCreatedPost);
  }, []);

  const emptyMessage = getEmptyMessage(activeFeed);

  return (
    <section className="page-content">
      <div className="feed-header">
        <button
          className={activeFeed === "forYou" ? "feed-tab active" : "feed-tab"}
          onClick={() => setActiveFeed("forYou")}
        >
          For You
        </button>
        <button
          className={activeFeed === "following" ? "feed-tab active" : "feed-tab"}
          onClick={() => setActiveFeed("following")}
        >
          Following
        </button>
        <button
          className="refresh-feed-button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh posts"
        >
          <FaSyncAlt className={refreshing ? "spinning" : ""} />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </div>
      <CreatePost onCreated={(post) => setPosts((currentPosts) => [post, ...currentPosts])} />

      {loading && <p className="status-message">Loading posts...</p>}
      {error && <p className="error-message list-message">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="status-message">{emptyMessage}</p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDelete={(id) => setPosts(posts.filter((item) => item._id !== id))}
          onOpenProfile={(username) => onNavigate("profile", username)}
          onRepostChange={(result) => {
            if (result.post) setPosts((current) => [result.post, ...current]);
          }}
        />
      ))}
    </section>
  );
}

const getPostsForFeed = (activeFeed) => {
  // The Following tab has its own API. For You shows all public posts.
  if (activeFeed === "following") return getFeedPosts();
  return getAllPosts();
};

const getEmptyMessage = (activeFeed) => {
  if (activeFeed === "following") {
    return "No posts from people you follow yet.";
  }

  return "No posts yet. Create your first post!";
};

export default Home;

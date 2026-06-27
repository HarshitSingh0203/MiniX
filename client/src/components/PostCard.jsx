import { useState } from "react";
import { addComment, deletePost, toggleBookmark, toggleLike } from "../services/postApi";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../services/apiConfig";
import "./PostCard.css";

function PostCard({ post, onDelete, onOpenProfile, onBookmarkChange }) {
  const { user, saveUser } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [bookmarked, setBookmarked] = useState(
    user.bookmarks?.some((id) => (id._id || id).toString() === post._id) || false
  );
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState("");

  const author = post.user || {};
  const liked = likes.some((id) => (id._id || id).toString() === user._id);
  const isOwner = (author._id || author).toString() === user._id;

  const handleLike = async () => {
    try {
      const result = await toggleLike(post._id);
      setLikes(result.likes);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    try {
      const comment = await addComment(post._id, commentText);
      setComments([...comments, comment]);
      setCommentText("");
      setShowComments(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(post._id);
      setBookmarked(result.bookmarked);
      saveUser({ ...user, bookmarks: result.bookmarks, token: localStorage.getItem("token") });
      onBookmarkChange?.(post._id, result.bookmarked);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await deletePost(post._id);
      onDelete(post._id);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <button className="avatar" onClick={() => onOpenProfile(author.username)}>
          {author.profilePic ? (
            <img src={getImageUrl(author.profilePic)} alt={author.name} />
          ) : (
            (author.name || "U").charAt(0).toUpperCase()
          )}
        </button>
        <button className="post-author" onClick={() => onOpenProfile(author.username)}>
          <strong>{author.name || "Unknown user"}</strong>
          <span>@{author.username || "user"}</span>
        </button>
        <time>{new Date(post.createdAt).toLocaleDateString()}</time>
        {isOwner && <button className="delete-button" onClick={handleDelete}>Delete</button>}
      </div>

      {post.text && <p className="post-text">{post.text}</p>}
      {post.image && <img className="post-image" src={getImageUrl(post.image)} alt="Post" />}

      {error && <p className="inline-error">{error}</p>}

      <div className="post-actions">
        <button className={liked ? "liked" : ""} onClick={handleLike}>
          {liked ? "♥" : "♡"} {likes.length}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          Comment {comments.length}
        </button>
        <button className={bookmarked ? "bookmarked" : ""} onClick={handleBookmark}>
          {bookmarked ? "Saved" : "Save"}
        </button>
      </div>

      {showComments && (
        <div className="comments">
          {comments.map((comment) => (
            <div className="comment" key={comment._id}>
              <strong>@{comment.user?.username || "user"}</strong> {comment.text}
            </div>
          ))}
          <form className="comment-form" onSubmit={handleComment}>
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </article>
  );
}

export default PostCard;

import { useState } from "react";
import {
  FaRegHeart,
  FaHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
  FaTrash,
  FaShare,
  FaRetweet,
} from "react-icons/fa";

import {
  addComment,
  deletePost,
  toggleBookmark,
  toggleLike,
  toggleRepost,
} from "../services/postApi";

import UserAvatar from "./UserAvatar";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../services/apiConfig";
import "./PostCard.css";

const getId = (value) => {
  // Sometimes MongoDB ids arrive as strings, sometimes as objects with _id.
  return (value?._id || value || "").toString();
};

function PostCard({ post, onDelete, onOpenProfile, onBookmarkChange, onRepostChange }) {
  const { user, saveUser } = useAuth();
  const displayPost = post.repostOf || post;
  const author = displayPost.user || {};
  const reposter = post.repostedBy || (post.repostOf ? post.user : null);
  const targetPostId = getId(displayPost);

  const [likes, setLikes] = useState(displayPost.likes || []);
  const [comments, setComments] = useState(displayPost.comments || []);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(
    user.bookmarks?.some((id) => getId(id) === targetPostId) || false
  );
  const [reposted, setReposted] = useState(getId(reposter) === user._id);

  const liked = likes.some((id) => getId(id) === user._id);
  const isOwner = getId(post.user) === user._id;

  const handleLike = async () => {
    try {
      const result = await toggleLike(targetPostId);
      setLikes(result.likes);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    try {
      const comment = await addComment(targetPostId, commentText);
      setComments([...comments, comment]);
      setCommentText("");
      setShowComments(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRepost = async () => {
    try {
      const result = await toggleRepost(targetPostId);
      setReposted(result.reposted);
      setRepostCount((current) => Math.max(0, current + (result.reposted ? 1 : -1)));
      onRepostChange?.(result);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(targetPostId);
      setBookmarked(result.bookmarked);
      saveUser({
        ...user,
        bookmarks: result.bookmarks,
        token: localStorage.getItem("token"),
      });
      onBookmarkChange?.(targetPostId, result.bookmarked);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${author.username}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Instant post", text: displayPost.text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setError("Profile link copied.");
    } catch {
      setError("Could not share this post.");
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
      {reposter && (
        <div className="repost-label">
          <FaRetweet />
          <span>Reposted by @{reposter.username}</span>
        </div>
      )}

      <UserAvatar
        as="button"
        className="post-avatar"
        user={author}
        alt={author.name || "User"}
        onClick={() => onOpenProfile(author.username)}
      />

      <div className="post-body">
        <div className="post-top">
          <button
            className="post-author"
            onClick={() => onOpenProfile(author.username)}
          >
            <strong>{author.name || "Unknown user"}</strong>
            <span>@{author.username || "user"}</span>
          </button>

          <span className="dot">.</span>
          <time>{new Date(displayPost.createdAt).toLocaleDateString()}</time>

          {isOwner && (
            <button className="delete-button" onClick={handleDelete} aria-label="Delete post">
              <FaTrash />
            </button>
          )}
        </div>

        {displayPost.text && <p className="post-text">{displayPost.text}</p>}

        {displayPost.image && (
          <img className="post-image" src={getImageUrl(displayPost.image)} alt="Post" />
        )}

        {error && <p className="inline-error">{error}</p>}

        <div className="post-actions">
          <button onClick={() => setShowComments(!showComments)} aria-label="Comment">
            <FaRegComment />
            <span>{comments.length}</span>
          </button>

          <button className={reposted ? "reposted" : ""} onClick={handleRepost} aria-label="Repost">
            <FaRetweet />
            <span>{repostCount}</span>
          </button>

          <button className={liked ? "liked" : ""} onClick={handleLike} aria-label="Like">
            {liked ? <FaHeart /> : <FaRegHeart />}
            <span>{likes.length}</span>
          </button>

          <button
            className={bookmarked ? "bookmarked" : ""}
            onClick={handleBookmark}
            aria-label="Bookmark"
          >
            {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>

          <button onClick={handleShare} aria-label="Share">
            <FaShare />
          </button>
        </div>

        {showComments && (
          <div className="comments">
            {comments.map((comment) => (
              <div className="comment" key={comment._id}>
                <button type="button" onClick={() => onOpenProfile(comment.user?.username)}>
                  @{comment.user?.username || "user"}
                </button>
                <span>{comment.text}</span>
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
      </div>
    </article>
  );
}

export default PostCard;

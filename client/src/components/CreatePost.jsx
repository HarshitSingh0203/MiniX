import { useEffect, useRef, useState } from "react";
import { FaImage, FaSmile, FaPoll, FaTimes, FaPen } from "react-icons/fa";
import EditMediaModal from "./EditMediaModal";
import UserAvatar from "./UserAvatar";
import { createPost } from "../services/postApi";
import { useAuth } from "../context/AuthContext";
import "./CreatePost.css";

function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [mediaEditor, setMediaEditor] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInput = useRef(null);
  const textareaRef = useRef(null);
  const previewUrlRef = useRef("");

  const emojis = [
    "\uD83D\uDE00",
    "\uD83D\uDE02",
    "\uD83D\uDE0D",
    "\uD83D\uDD25",
    "\uD83D\uDC4F",
    "\uD83D\uDE4F",
    "\u2728",
    "\uD83D\uDC99",
    "\uD83C\uDF89",
    "\uD83D\uDE0E",
    "\uD83E\uDD14",
    "\uD83D\uDE2D",
  ];

  useEffect(() => {
    return () => {
      // Free the temporary browser image URL when this component closes.
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setImageWithPreview = (selectedImage, previewUrl) => {
    // Only keep one preview URL at a time so the browser does not waste memory.
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setImage(selectedImage);
    setImagePreview(previewUrl);
    previewUrlRef.current = previewUrl;
  };

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0] || null;

    if (selectedImage) {
      const previewUrl = URL.createObjectURL(selectedImage);
      setImageWithPreview(selectedImage, previewUrl);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setImage(null);
    setImagePreview("");
    setMediaEditor(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleEditImage = () => {
    if (!image || !imagePreview) return;
    setMediaEditor({
      url: imagePreview,
      fileName: image.name || "post-image.jpg",
    });
  };

  const handleApplyCrop = ({ file, previewUrl }) => {
    setImageWithPreview(file, previewUrl);
    setMediaEditor(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? text.length;
    const end = textarea?.selectionEnd ?? text.length;

    // Place the emoji where the cursor is, instead of always adding it at the end.
    const nextText = `${text.slice(0, start)}${emoji}${text.slice(end)}`;

    setText(nextText);
    setShowEmojiPicker(false);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handlePollOptionChange = (index, value) => {
    setPollOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  };

  const togglePoll = () => {
    setShowPoll(!showPoll);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanPollOptions = showPoll
      ? pollOptions.map((option) => option.trim()).filter(Boolean)
      : [];

    if (!text.trim() && !image && cleanPollOptions.length === 0) {
      setError("Write something or choose an image");
      return;
    }

    if (showPoll && cleanPollOptions.length < 2) {
      setError("Add at least two poll options");
      return;
    }

    const postText = makePostText(text, cleanPollOptions);
    const formData = new FormData();
    formData.append("text", postText);
    if (image) formData.append("image", image);

    try {
      setLoading(true);
      setError("");

      const post = await createPost(formData);

      setText("");
      handleRemoveImage();
      setShowPoll(false);
      setPollOptions(["", ""]);
      setShowEmojiPicker(false);

      if (fileInput.current) fileInput.current.value = "";

      onCreated(post);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-post" onSubmit={handleSubmit}>
      <UserAvatar className="create-avatar" user={user} alt={user?.name || "Profile"} />

      <div className="create-body">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What is happening?"
          rows="3"
        />

        {imagePreview && (
          <div className="selected-image">
            <img src={imagePreview} alt="Selected upload" />
            <div className="selected-image-actions">
              <button type="button" onClick={handleEditImage}>
                <FaPen />
                <span>Edit</span>
              </button>
              <button type="button" onClick={handleRemoveImage} aria-label="Remove image">
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {showPoll && (
          <div className="poll-box">
            <div className="poll-header">
              <strong>Poll</strong>
              <button type="button" onClick={togglePoll} aria-label="Remove poll">
                <FaTimes />
              </button>
            </div>
            {pollOptions.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(event) => handlePollOptionChange(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
              />
            ))}
          </div>
        )}

        {error && <p className="inline-error">{error}</p>}

        <div className="create-post-actions">
          <div className="create-icons">
            <label className="image-button">
              <FaImage />
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

            <div className="emoji-wrap">
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <FaSmile />
              </button>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={showPoll ? "active-tool" : ""}
              onClick={togglePoll}
            >
              <FaPoll />
            </button>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {mediaEditor && (
        <EditMediaModal
          source={mediaEditor}
          aspect={16 / 9}
          title="Edit Media"
          onApply={handleApplyCrop}
          onCancel={() => setMediaEditor(null)}
        />
      )}
    </form>
  );
}

const makePostText = (text, pollOptions) => {
  if (pollOptions.length === 0) return text;

  const pollText = pollOptions
    .map((option, index) => `${index + 1}. ${option}`)
    .join("\n");

  if (!text.trim()) return `Poll:\n${pollText}`;

  return `${text.trim()}\n\nPoll:\n${pollText}`;
};

export default CreatePost;

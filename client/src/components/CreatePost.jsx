import { useRef, useState } from "react";
import { createPost } from "../services/postApi";
import "./CreatePost.css";

function CreatePost({ onCreated }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!text.trim() && !image) {
      setError("Write something or choose an image");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);
    if (image) formData.append("image", image);

    try {
      setLoading(true);
      setError("");
      const post = await createPost(formData);
      setText("");
      setImage(null);
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
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What is happening?"
        rows="3"
      />

      {image && <p className="selected-file">Selected: {image.name}</p>}
      {error && <p className="inline-error">{error}</p>}

      <div className="create-post-actions">
        <label className="image-button">
          Add image
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files[0] || null)}
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

export default CreatePost;

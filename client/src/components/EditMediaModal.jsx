import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./EditMediaModal.css";

const cropImage = (sourceUrl, zoom, aspect, fileName) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      // Create a new canvas image with the required shape.
      const outputWidth = 1200;
      const outputHeight = Math.round(outputWidth / aspect);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const imageAspect = image.naturalWidth / image.naturalHeight;
      let cropWidth = image.naturalWidth;
      let cropHeight = image.naturalHeight;

      // Choose the biggest center crop that matches the target aspect ratio.
      if (imageAspect > aspect) {
        cropWidth = image.naturalHeight * aspect;
      } else {
        cropHeight = image.naturalWidth / aspect;
      }

      cropWidth /= zoom;
      cropHeight /= zoom;

      const cropX = (image.naturalWidth - cropWidth) / 2;
      const cropY = (image.naturalHeight - cropHeight) / 2;

      context.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not crop image"));
          return;
        }

        // Convert the canvas back into a file that can be uploaded.
        const file = new File([blob], fileName || "edited-image.jpg", {
          type: "image/jpeg",
        });
        resolve({ file, previewUrl: URL.createObjectURL(blob) });
      }, "image/jpeg", 0.92);
    };
    image.onerror = reject;
    image.src = sourceUrl;
  });

function EditMediaModal({ source, aspect = 1, title = "Edit Media", onApply, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    try {
      setApplying(true);
      setError("");
      const result = await cropImage(source.url, zoom, aspect, source.fileName);
      onApply(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="media-editor" role="dialog" aria-modal="true">
      <div className="media-editor-backdrop" onClick={onCancel} />
      <div className="media-editor-dialog">
        <div className="media-editor-header">
          <button type="button" onClick={onCancel} aria-label="Back">
            <FaArrowLeft />
            <span>Back</span>
          </button>
          <h2>{title}</h2>
          <button type="button" className="media-apply-button" onClick={handleApply} disabled={applying}>
            {applying ? "Applying..." : "Apply"}
          </button>
        </div>

        <div className="media-preview-frame" style={{ aspectRatio: aspect }}>
          <img src={source.url} alt="Crop preview" style={{ transform: `scale(${zoom})` }} />
        </div>

        <label className="zoom-control">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        {error && <p className="inline-error">{error}</p>}
      </div>
    </div>
  );
}

export default EditMediaModal;

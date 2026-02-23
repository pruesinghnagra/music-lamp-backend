"use client";

import { useState } from "react";

export default function ImageUpload({
  essays,
  selectedEssay,
  setSelectedEssay,
  setImages,
}: any) {
  const [image, setImage] = useState<File | null>(null);

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return alert("No file selected");
    if (!selectedEssay) return alert("No essay selected");

    const formData = new FormData();
    formData.append("file", image);
    formData.append("essayId", selectedEssay);

    try {
      await fetch("/api/image-uploader", { method: "POST", body: formData });
      alert("Image uploaded");
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    }
  };

  return (
    <section>
      <h2>Upload Image for Essay</h2>

      {/* Essay selection */}
      <select
        value={selectedEssay}
        onChange={(e) => setSelectedEssay(e.target.value)}
      >
        {(essays || []).map((essay: any) => (
          <option key={essay.id} value={essay.id}>
            {essay.title}
          </option>
        ))}
      </select>

      {/* File input */}
      <form onSubmit={handleImageUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        <button type="submit">Upload Image</button>
      </form>
    </section>
  );
}

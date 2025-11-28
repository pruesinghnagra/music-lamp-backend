"use client";

import { useEffect, useState } from "react";

type Essay = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

type Media = {
  id: string;
  url: string;
  essayId?: string | null;
};

export default function AdminPage() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [selectedEssay, setSelectedEssay] = useState("library");
  const [images, setImages] = useState<Media[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load essays
  useEffect(() => {
    async function loadEssays() {
      const res = await fetch("/api/essays");
      const data = await res.json();
      setEssays(data);
    }
    loadEssays();
  }, []);

  // Load images
  useEffect(() => {
    async function loadImages() {
      const res = await fetch("/api/image-uploader");
      const data: Media[] = await res.json();
      setImages(data);
    }
    loadImages();
  }, []);

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Select an image");

    const formData = new FormData();
    formData.append("file", imageFile);

    if (selectedEssay !== "library") {
      formData.append("essayId", selectedEssay);
    }

    const res = await fetch("/api/image-uploader", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const newImage = await res.json();
      setImages((prev) => [...prev, newImage]);
      setImageFile(null);
    } else {
      alert("Failed to upload image");
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Delete this image?")) return;

    const res = await fetch(`/api/image-uploader?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== id));
    } else {
      alert("Failed to delete image");
    }
  };

  // Separate orphan images
  const orphanImages = images.filter((img) => !img.essayId);
  const imagesByEssay = images.filter((img) => img.essayId);

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Essay select for image upload */}
      <section>
        <h2>Upload Image</h2>
        <select
          value={selectedEssay}
          onChange={(e) => setSelectedEssay(e.target.value)}
        >
          <option value="library">Upload to library (no essay)</option>
          {essays.map((essay) => (
            <option key={essay.id} value={essay.id}>
              {essay.title}
            </option>
          ))}
        </select>
        <form onSubmit={handleImageUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <button type="submit">Upload</button>
        </form>
      </section>

      {/* Orphan images */}
      {orphanImages.length > 0 && (
        <section>
          <h2>Orphan Images (no essay)</h2>
          <ul>
            {orphanImages.map((img) => (
              <li key={img.id}>
                <img src={img.url} width={100} alt="" />
                <button onClick={() => handleDeleteImage(img.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Images grouped by essay */}
      {essays.map((essay) => {
        const essayImages = imagesByEssay.filter(
          (img) => img.essayId === essay.id
        );
        if (essayImages.length === 0) return null;
        return (
          <section key={essay.id}>
            <h2>Images for {essay.title}</h2>
            <ul>
              {essayImages.map((img) => (
                <li key={img.id}>
                  <img src={img.url} width={100} alt="" />
                  <button onClick={() => handleDeleteImage(img.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

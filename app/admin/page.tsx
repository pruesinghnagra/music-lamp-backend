"use client";

import { use, useEffect, useState } from "react";

export default function AdminPage() {
  const [image, setImage] = useState<File | null>(null);
  const [images, setImages] = useState<
    { id: string; url: string; essayId: string }[]
  >([]);
  const [essays, setEssays] = useState<
    {
      status: string | number | readonly string[] | undefined;
      slug: string;
      id: string;
      title: string;
    }[]
  >([]);
  const [selectedEssay, setSelectedEssay] = useState("");
  // Creating the essay
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [albumRefProvider, setAlbumRefProvider] = useState("");
  const [albumRefId, setAlbumRefId] = useState("");

  const uniqueEssays = Array.from(
    new Map(essays.map((e) => [e.id, e])).values()
  );

  const tagsArray = tags
    .split(/[, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    async function loadEssays() {
      const res = await fetch("/api/essays");
      const data = await res.json();
      setEssays(data);

      if (data.length > 0) {
        setSelectedEssay(data[0].id);
      }
    }
    loadEssays();
  }, []);

  useEffect(() => {
    async function loadImages() {
      if (!selectedEssay) return;
      const res = await fetch("/api/image-uploader");
      const data = await res.json();
      // Show all images
      setImages(data);
    }
    loadImages();
  }, [selectedEssay]);

  const handleCreateEssay = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: title.toLowerCase().replace(/\s+/g, "-"),
          content,
          tags: tagsArray,
          status,
          coverImage: null,
          imageCredit: null,
          albumRefProvider,
          albumRefId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Essay uploaded: ${data.title}`);
        setSelectedEssay(data.id);
        setEssays((prev) => [
          ...prev,
          { id: data.id, title: data.title, slug: data.slug, status },
        ]);
        setTitle("");
        setContent("");
        setTags("");
        setStatus("DRAFT");
      } else {
        alert("Failed to upload essay");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading essay");
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return alert("no file selected");

    try {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("essayId", selectedEssay);

      await fetch("/api/image-uploader", {
        method: "POST",
        body: formData,
      });
      alert("image uploaded");
    } catch (err) {
      console.error(err);
      alert("image save error");
    }
  };

  const handleStatusChange = async (slug: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/essays/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setEssays((prev) =>
          prev.map((e) => (e.slug === slug ? { ...e, status: newStatus } : e))
        );
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  const handleDeleteEssay = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this essay?")) return;

    const res = await fetch(`/api/essays/${slug}`, { method: "DELETE" });

    if (res.ok) {
      setEssays((prev) => prev.filter((e) => e.slug !== slug));
    } else {
      alert("Failed to delete essay");
    }
  };

  async function handleDeleteImage(id: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/image-uploader?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        alert("Image deleted");
      } else {
        const data = await res.json();
        alert("Failed to delete image: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting image");
    }
  }

  return (
    <div>
      <h1>Music Lamp - Admin Dashboard</h1>

      {/* New essay form */}
      <section>
        <h2>Create Essay</h2>
        <form onSubmit={handleCreateEssay}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <button type="submit">Save Essay</button>
        </form>
      </section>

      {/* Select and upload images */}
      <section>
        <h2>Upload Image for Essay</h2>
        <select
          value={selectedEssay}
          onChange={(e) => setSelectedEssay(e.target.value)}
        >
          {uniqueEssays.map((essay) => (
            <option key={essay.id} value={essay.id}>
              {essay.title}
            </option>
          ))}
        </select>

        <form onSubmit={handleImageUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          <button type="submit">Upload Image</button>
        </form>

        <h2>Image from external API</h2>
        <input
          type="text"
          placeholder="Album Provider (e.g., lastfm)"
          value={albumRefProvider}
          onChange={(e) => setAlbumRefProvider(e.target.value)}
        />
        <input
          type="text"
          placeholder="Album Ref URL"
          value={albumRefId}
          onChange={(e) => setAlbumRefId(e.target.value)}
        />
      </section>

      {/* List of Essays */}
      <section>
        <h2>List of Essays</h2>
        <ul>
          {essays.map((essay) => (
            <li key={essay.id}>
              {" "}
              {essay.title}
              <button onClick={() => handleDeleteEssay(essay.slug)}>
                Delete
              </button>
              <select
                value={essay.status}
                onChange={(e) => handleStatusChange(essay.slug, e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>All Images</h2>
        {images.length === 0 && <p>No images uploaded yet.</p>}
        <ul>
          {images.map((img) => {
            // Find the essay title, fallback if none
            const essay = essays.find((e) => e.id === img.essayId);
            const essayTitle = essay ? essay.title : "No Essay";

            return (
              <li key={img.id} style={{ marginBottom: "10px" }}>
                <img src={img.url} alt="" width={100} />
                <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
                  {essayTitle}
                </span>
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

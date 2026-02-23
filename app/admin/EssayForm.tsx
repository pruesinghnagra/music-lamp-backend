"use client";

import { useState } from "react";

export default function EssayForm({
  essays,
  setEssays,
  setSelectedEssay,
}: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [albumRefProvider, setAlbumRefProvider] = useState("");
  const [albumRefId, setAlbumRefId] = useState("");

  const tagsArray = tags
    .split(/[, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);

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
        setSelectedEssay(data.id);
        setEssays([...essays, data]);
        setTitle("");
        setContent("");
        setTags("");
        setStatus("DRAFT");
      } else alert("Failed to upload essay");
    } catch (err) {
      console.error(err);
      alert("Error uploading essay");
    }
  };

  return (
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
          placeholder="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <input
          placeholder="Album Provider"
          value={albumRefProvider}
          onChange={(e) => setAlbumRefProvider(e.target.value)}
        />
        <input
          placeholder="Album Ref URL"
          value={albumRefId}
          onChange={(e) => setAlbumRefId(e.target.value)}
        />
        <button type="submit">Save Essay</button>
      </form>
    </section>
  );
}

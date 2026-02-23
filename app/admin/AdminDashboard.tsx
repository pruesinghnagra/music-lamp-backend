"use client";

import { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import EssayForm from "./EssayForm";
import EssayList from "./EssayList";
import ImageUpload from "./ImageUpload";
import ImageList from "./ImageList";

export default function AdminDashboard() {
  // Login state
  const [auth, setAuth] = useState(false);

  // Shared state
  const [essays, setEssays] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedEssay, setSelectedEssay] = useState("");

  // Fetch essays
  useEffect(() => {
    async function loadEssays() {
      const res = await fetch("/api/essays");
      const data = await res.json();
      setEssays(data);
      if (data.length > 0) setSelectedEssay(data[0].id);
    }
    loadEssays();
  }, []);

  // Fetch images when selectedEssay changes
  useEffect(() => {
    async function loadImages() {
      if (!selectedEssay) return;
      const res = await fetch("/api/image-uploader");
      const data = await res.json();
      setImages(data);
    }
    loadImages();
  }, [selectedEssay]);

  if (!auth) {
    return <LoginForm onSuccess={() => setAuth(true)} />;
  }

  return (
    <div>
      <h1>Music Lamp - Admin Dashboard</h1>
      <EssayForm
        essays={essays}
        setEssays={setEssays}
        selectedEssay={selectedEssay}
        setSelectedEssay={setSelectedEssay}
      />
      <EssayList
        essays={essays}
        setEssays={setEssays}
        handleStatusChange={null} // will implement in EssayList
        handleDeleteEssay={null} // will implement in EssayList
      />
      <ImageUpload selectedEssay={selectedEssay} setImages={setImages} />
      <ImageList images={images} essays={essays} setImages={setImages} />
    </div>
  );
}

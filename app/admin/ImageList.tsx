"use client";

export default function ImageList({ images, essays, setImages }: any) {
  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(`/api/image-uploader?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) setImages(images.filter((img: any) => img.id !== id));
      else alert("Failed to delete image");
    } catch {
      alert("Error deleting image");
    }
  };

  return (
    <section>
      <h2>All Images</h2>
      {images.length === 0 && <p>No images uploaded yet.</p>}
      <ul>
        {images.map((img: any) => {
          const essay = essays.find((e: any) => e.id === img.essayId);
          return (
            <li key={img.id}>
              <img src={img.url} width={100} />
              <span>{essay ? essay.title : "No Essay"}</span>
              <button onClick={() => handleDeleteImage(img.id)}>Delete</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

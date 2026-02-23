"use client";

export default function EssayList({ essays, setEssays }: any) {
  const handleStatusChange = async (slug: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/essays/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEssays(
          essays.map((e: any) =>
            e.slug === slug ? { ...e, status: newStatus } : e,
          ),
        );
      }
    } catch {
      alert("Error updating status");
    }
  };

  const handleDeleteEssay = async (slug: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/essays/${slug}`, { method: "DELETE" });
    if (res.ok) setEssays(essays.filter((e: any) => e.slug !== slug));
    else alert("Failed to delete essay");
  };

  return (
    <section>
      <h2>List of Essays</h2>
      <ul>
        {essays.map((essay: any) => (
          <li key={essay.id}>
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
  );
}

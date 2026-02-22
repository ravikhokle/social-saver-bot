const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function fetchBookmarks(params: {
  search?: string;
  category?: string;
  platform?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.category) searchParams.set("category", params.category);
  if (params.platform) searchParams.set("platform", params.platform);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API_URL}/bookmarks?${searchParams}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  return res.json();
}

export async function fetchRandomBookmark() {
  const res = await fetch(`${API_URL}/bookmarks/random`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch random bookmark");
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/bookmarks/categories`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/bookmarks/stats`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function deleteBookmark(id: string) {
  const res = await fetch(`${API_URL}/bookmarks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete bookmark");
  return res.json();
}

export async function togglePin(id: string, pinned: boolean) {
  const res = await fetch(`${API_URL}/bookmarks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinned }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to update bookmark");
  }
  return res.json();
}

export async function testSaveUrl(url: string, phone?: string) {
  const res = await fetch(`${API_URL}/webhook/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, phone }),
  });
  if (!res.ok) throw new Error("Failed to save URL");
  return res.json();
}

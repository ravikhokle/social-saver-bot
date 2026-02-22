export interface Bookmark {
  _id: string;
  user: {
    _id: string;
    phone: string;
    name: string;
  };
  url: string;
  platform: "instagram" | "twitter" | "youtube" | "article";
  title: string;
  caption: string;
  summary: string;
  category: string;
  tags: string[];
  thumbnail: string;
  videoUrl?: string;
  embedUrl: string;
  author: string;
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkResponse {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface Stats {
  total: number;
  platforms: Record<string, number>;
  topCategories: CategoryCount[];
}

// Type definitions for Supabase database tables
// Based on the study vault plan.md database structure

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "uploader" | "super_admin";
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  category_id: string | null;
  file_name: string;
  file_key: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  thumbnail: string | null;
  tags: string[] | null;
  version: string | null;
  is_featured: boolean;
  download_count: number;
  view_count: number;
};

export type Bookmark = {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type BlogPostCategory = "news" | "event" | "course" | "competition";

export type BlogPost = {
  id: string;
  title: string;
  category: BlogPostCategory;
  body: string;
  link: string | null;
  author_id: string;
  author_name: string;
  created_at: string;
};
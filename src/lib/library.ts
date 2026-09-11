"use client";

import type { useSupabase } from "@/lib/supabase";

export const YEARS = [1, 2, 3, 4, 5] as const;
export const SEMESTERS = [1, 2] as const;
export const SUBJECT_FOLDERS = ["Notes", "Reference Books"] as const;

export type SubjectFolder = (typeof SUBJECT_FOLDERS)[number];
export type SemesterSubjects = { semester: number; subjects: SubjectRow[] };
export type SubjectRow = { id: string; name: string; year: number; semester: number };

type SupabaseClient = ReturnType<typeof useSupabase>["supabase"];

/** Canonical URL segment for a subject name. */
export function subjectSlug(name: string) {
  return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, " "));
}

/** Local, human readable label like "Semester 3" from a URL param. */
export function semesterLabel(semester: number) {
  return `Semester ${semester}`;
}

export async function fetchAllSubjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, year, semester")
    .order("year")
    .order("semester")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as SubjectRow[];
}

/**
 * Create a subject in the given year/semester. The database trigger
 * (supabase/migrations/0002) automatically creates the "Notes" and
 * "Reference Books" folders for the new subject.
 */
export async function createSubject(
  supabase: SupabaseClient,
  input: { name: string; year: number; semester: number; description?: string },
) {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) throw new Error("Subject name is required.");

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      name,
      year: input.year,
      semester: input.semester,
      description: input.description?.trim() || null,
    })
    .select("id, name, year, semester")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`"${name}" already exists in Year ${input.year} · Semester ${input.semester}.`);
    }
    throw new Error(error.message);
  }
  return data as SubjectRow;
}

export async function deleteSubject(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function groupByYear(subjects: SubjectRow[]) {
  return YEARS.map((year) => ({
    year,
    semesters: SEMESTERS.map((semester) => ({
      semester,
      subjects: subjects.filter((subject) => subject.year === year && subject.semester === semester),
    })),
  }));
}

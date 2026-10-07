export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { ensureUploadDir, saveFile } from "@/lib/local-storage";

// Simple in-memory upload rate limiter.
// Keys are Clerk user IDs; values are arrays of epoch-ms timestamps.
// Resets automatically every hour. Suitable for the self-hosted standalone server.
interface RateLimitBucket {
  timestamps: number[];
}
const uploadLimits = new Map<string, RateLimitBucket>();

const MAX_UPLOADS_PER_MINUTE = 10;
const MAX_UPLOADS_PER_HOUR = 100;
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function isRateLimited(userId: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  let bucket = uploadLimits.get(userId);
  if (!bucket) {
    bucket = { timestamps: [] };
    uploadLimits.set(userId, bucket);
  }

  // Keep only timestamps within the last hour
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < ONE_HOUR);

  // Hourly limit
  if (bucket.timestamps.length >= MAX_UPLOADS_PER_HOUR) {
    const oldest = bucket.timestamps[0];
    return { limited: true, retryAfter: Math.ceil((oldest + ONE_HOUR - now) / 1000) };
  }

  // Per-minute limit
  const recent = bucket.timestamps.filter((ts) => now - ts < ONE_MINUTE);
  if (recent.length >= MAX_UPLOADS_PER_MINUTE) {
    const oldestRecent = recent[0];
    return { limited: true, retryAfter: Math.ceil((oldestRecent + ONE_MINUTE - now) / 1000) };
  }

  bucket.timestamps.push(now);
  return { limited: false };
}

// POST /api/upload - Multipart upload in one shot: write file + save document row.
// Used by FileUpload.tsx and gallery/page.tsx (small files < 4MB).
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = isRateLimited(userId);
    if (limit.limited) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please slow down." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter || 60) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Basic file-size guard (4MB)
    const MAX_FILE_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    // Accept both snake_case (FileUpload) and camelCase (gallery)
    const boatId = (formData.get("boat_id") as string) || (formData.get("boatId") as string) || undefined;
    const componentId = (formData.get("component_id") as string) || (formData.get("componentId") as string) || undefined;
    const logEntryId = (formData.get("log_entry_id") as string) || (formData.get("logEntryId") as string) || undefined;
    const name = (formData.get("name") as string) || file.name;
    const category = (formData.get("category") as string) || "other";

    const supabase = createServerClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    ensureUploadDir();
    const { publicUrl } = await saveFile(file, dbUser.id, boatId);

    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        boat_id: boatId || null,
        component_id: componentId || null,
        log_entry_id: logEntryId || null,
        category,
        name,
        file_url: publicUrl,
        file_type: file.type || "application/octet-stream",
        file_size: file.size || 0,
        reminder_days: 30,
        uploaded_by: dbUser.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("POST /api/upload DB error:", dbError);
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

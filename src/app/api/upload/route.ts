export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { ensureUploadDir, saveFile } from "@/lib/local-storage";

// POST /api/upload - Multipart upload in one shot: write file + save document row.
// Used by FileUpload.tsx and gallery/page.tsx (small files < 4MB).
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function normalizeBlogSlug(value: unknown) {
  return decodeURIComponent(String(value || ""))
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^tin-tuc\/+/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = normalizeBlogSlug(body.slug);

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
    }

    const { error } = await supabase.rpc("increment_blog_view", {
      p_slug: slug,
    });

    if (error) {
      console.error("Lỗi tăng lượt xem bài viết:", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lỗi API blog-view:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

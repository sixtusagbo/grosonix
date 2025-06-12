import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/ai/voice-samples:
 *   get:
 *     summary: Get user's voice samples
 *     description: Retrieve all voice samples for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Voice samples retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voice_samples:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VoiceSample'
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's voice samples
    const { data: voiceSamples, error } = await supabase
      .from("user_voice_samples")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching voice samples:", error);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to fetch voice samples",
        },
        { status: 500 }
      );
    }

    return Response.json({
      voice_samples: voiceSamples || [],
      count: voiceSamples?.length || 0,
    });
  } catch (error) {
    console.error("Get voice samples error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to retrieve voice samples",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/voice-samples:
 *   post:
 *     summary: Add a new voice sample
 *     description: Add a new voice sample for style analysis
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - content
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *               content:
 *                 type: string
 *                 description: The post content
 *               additional_instructions:
 *                 type: string
 *                 description: Additional instructions for style analysis
 *     responses:
 *       201:
 *         description: Voice sample added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voice_sample:
 *                   $ref: '#/components/schemas/VoiceSample'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform, content, additional_instructions } = body;

    if (!platform || !content) {
      return Response.json(
        { error: "Bad request", message: "Platform and content are required" },
        { status: 400 }
      );
    }

    if (!["twitter", "instagram", "linkedin"].includes(platform)) {
      return Response.json(
        { error: "Bad request", message: "Invalid platform" },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return Response.json(
        { error: "Bad request", message: "Content cannot be empty" },
        { status: 400 }
      );
    }

    // Check if user already has 3 voice samples (limit)
    const { data: existingSamples, error: countError } = await supabase
      .from("user_voice_samples")
      .select("id")
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error checking existing samples:", countError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to check existing samples",
        },
        { status: 500 }
      );
    }

    if (existingSamples && existingSamples.length >= 3) {
      return Response.json(
        {
          error: "Limit exceeded",
          message:
            "Maximum of 3 voice samples allowed. Please delete one to add a new sample.",
        },
        { status: 400 }
      );
    }

    // Insert new voice sample
    const { data: voiceSample, error: insertError } = await supabase
      .from("user_voice_samples")
      .insert({
        user_id: user.id,
        platform,
        content: content.trim(),
        additional_instructions: additional_instructions?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting voice sample:", insertError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to save voice sample",
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        voice_sample: voiceSample,
        message: "Voice sample added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add voice sample error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to add voice sample",
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/ai/voice-samples:
 *   delete:
 *     summary: Delete a voice sample
 *     description: Delete a specific voice sample by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Voice sample ID to delete
 *     responses:
 *       200:
 *         description: Voice sample deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Voice sample not found
 */
export async function DELETE(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  const sampleId = searchParams.get("id");

  if (!sampleId) {
    return Response.json(
      { error: "Bad request", message: "Sample ID is required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // Delete the voice sample (RLS will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from("user_voice_samples")
      .delete()
      .eq("id", sampleId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting voice sample:", deleteError);
      return Response.json(
        {
          error: "Internal server error",
          message: "Failed to delete voice sample",
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "Voice sample deleted successfully",
    });
  } catch (error) {
    console.error("Delete voice sample error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: "Failed to delete voice sample",
      },
      { status: 500 }
    );
  }
}

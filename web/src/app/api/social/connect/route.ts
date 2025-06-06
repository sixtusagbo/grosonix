import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getTwitterAuthUrl, getInstagramAuthUrl, getLinkedInAuthUrl } from '@/lib/social';

/**
 * @swagger
 * /api/social/connect:
 *   post:
 *     summary: Initiate social media connection
 *     description: Get OAuth URL for connecting a social media platform
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
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *                 description: Social media platform to connect
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth_url:
 *                   type: string
 *                   description: OAuth authorization URL
 *                 platform:
 *                   type: string
 *                   description: Platform being connected
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform || !['twitter', 'instagram', 'linkedin'].includes(platform)) {
      return Response.json(
        { error: 'Bad request', message: 'Valid platform is required (twitter, instagram, linkedin)' },
        { status: 400 }
      );
    }

    let authUrl: string;

    switch (platform) {
      case 'twitter':
        authUrl = getTwitterAuthUrl();
        break;
      case 'instagram':
        authUrl = getInstagramAuthUrl();
        break;
      case 'linkedin':
        authUrl = getLinkedInAuthUrl();
        break;
      default:
        return Response.json(
          { error: 'Bad request', message: 'Unsupported platform' },
          { status: 400 }
        );
    }

    return Response.json({
      auth_url: authUrl,
      platform,
    });
  } catch (error) {
    console.error('Social connect error:', error);
    return Response.json(
      { error: 'Internal server error', message: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
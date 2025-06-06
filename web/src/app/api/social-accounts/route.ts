import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/social-accounts:
 *   get:
 *     summary: Get user's social accounts
 *     description: Retrieve all connected social media accounts for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Social accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SocialAccount'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
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

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('id, platform, expires_at, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      return Response.json(
        { error: 'Fetch failed', message: error.message },
        { status: 400 }
      );
    }

    return Response.json(accounts || []);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch social accounts' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/social-accounts:
 *   post:
 *     summary: Connect a social media account
 *     description: Add a new social media account connection for the authenticated user
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
 *               - access_token
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [twitter, instagram, linkedin]
 *                 description: Social media platform
 *               access_token:
 *                 type: string
 *                 description: OAuth access token
 *               refresh_token:
 *                 type: string
 *                 description: OAuth refresh token (optional)
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: Token expiration time (optional)
 *     responses:
 *       201:
 *         description: Social account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SocialAccount'
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
    const { platform, access_token, refresh_token, expires_at } = body;

    if (!platform || !access_token) {
      return Response.json(
        { error: 'Bad request', message: 'Platform and access_token are required' },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from('social_accounts')
      .insert({
        user_id: user.id,
        platform,
        access_token,
        refresh_token,
        expires_at,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: 'Connection failed', message: error.message },
        { status: 400 }
      );
    }

    return Response.json(account, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', message: 'Failed to connect social account' },
      { status: 500 }
    );
  }
}
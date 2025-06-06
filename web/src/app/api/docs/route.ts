import { getApiDocs } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation
 *     description: Returns the OpenAPI specification for the Grosonix API
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  const spec = await getApiDocs();
  return Response.json(spec);
}
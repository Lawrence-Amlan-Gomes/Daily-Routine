// src/app/api/verify-jwt/route.ts
import { verifyJwtToken } from '@/app/actions';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return new Response('Missing token', { status: 400 });

    const user = await verifyJwtToken(token);
    if (!user) return new Response('Invalid token', { status: 401 });

    return Response.json(user);
  } catch (error) {
    return new Response('Server error', { status: 500 });
  }
}
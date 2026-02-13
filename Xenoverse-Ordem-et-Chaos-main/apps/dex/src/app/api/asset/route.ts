
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Legacy route: Assets should now be served statically from public/
  // Checking path param and redirecting if possible, or returning 404
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (path) {
    // Redirect to static path
    return NextResponse.redirect(new URL(`/${path}`, request.url));
  }

  return new NextResponse('Asset not found', { status: 404 });
}

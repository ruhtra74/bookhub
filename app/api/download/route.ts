import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { readFile } from 'fs/promises';
import path from 'path';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 401 });
  }

  try {
    // Vérifie et décode le token JWT
    await jwtVerify(token, SECRET);
  } catch {
    return NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 403 });
  }

  try {
    // Lit le fichier depuis le dossier privé (hors de /public)
    const filePath = path.join(process.cwd(), 'private', 'chapter1.pdf');
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="chapter1.pdf"',
        // Empêche la mise en cache du lien sécurisé
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }
}
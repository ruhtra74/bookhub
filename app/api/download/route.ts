import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET);

async function verifyToken(token: string | null) {
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

// GET /api/download?token=xxx&list=true          → liste des fichiers disponibles
// GET /api/download?token=xxx&file=chapitre1.mp3 → téléchargement d'un fichier
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const isList = req.nextUrl.searchParams.get('list') === 'true';
  const fileName = req.nextUrl.searchParams.get('file');

  const isValid = await verifyToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Token invalide ou expiré.' }, { status: 403 });
  }

  // ── Mode liste ─────────────────────────────────────────────────────────────
  if (isList) {
    try {
      const privateDir = path.join(process.cwd(), 'private');
      const allFiles = await readdir(privateDir);

      const pdf = allFiles.find(f => f.toLowerCase().endsWith('.pdf')) ?? null;
      const audioFiles = allFiles
        .filter(f => /\.(mp3|m4a|ogg|wav)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      return NextResponse.json({ pdf, audioFiles });
    } catch {
      return NextResponse.json({ error: 'Dossier privé introuvable.' }, { status: 500 });
    }
  }

  // ── Mode téléchargement ────────────────────────────────────────────────────
  if (!fileName) {
    return NextResponse.json({ error: 'Paramètre "file" manquant.' }, { status: 400 });
  }

  // Sécurité : empêche la traversée de répertoire
  const safeName = path.basename(fileName);
  if (!/\.(pdf|mp3|m4a|ogg|wav)$/i.test(safeName)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé.' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'private', safeName);
    const fileBuffer = await readFile(filePath);

    const ext = safeName.split('.').pop()?.toLowerCase();
    const contentType =
      ext === 'pdf' ? 'application/pdf' :
      ext === 'm4a' ? 'audio/mp4' :
      ext === 'ogg' ? 'audio/ogg' :
      ext === 'wav' ? 'audio/wav' :
      'audio/mpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }
}
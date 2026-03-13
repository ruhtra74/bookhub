'use server'

import { appendUserToSheet } from '@/lib/googleSheets';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET);

export async function handleDownloadRequest(formData: FormData) {
  const pseudo = formData.get('pseudo') as string;
  const email = formData.get('email') as string;

  // Si des infos sont fournies, on les enregistre (mais ce n'est plus obligatoire)
  if (pseudo && email) {
    await appendUserToSheet(pseudo, email);
    // On ne bloque plus si l'enregistrement échoue
  }

  // On génère le token dans tous les cas
  const token = await new SignJWT({ email: email || 'anonyme', pseudo: pseudo || 'anonyme' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1m')
    .setIssuedAt()
    .sign(SECRET);

  return { success: true, token };
}
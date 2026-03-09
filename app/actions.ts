'use server'

import { appendUserToSheet } from '@/lib/googleSheets';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET);

export async function handleDownloadRequest(formData: FormData) {
  const pseudo = formData.get('pseudo') as string;
  const email = formData.get('email') as string;

  if (!pseudo || !email) {
    return { success: false, error: 'Champs manquants.' };
  }

  const result = await appendUserToSheet(pseudo, email);

  if (!result.success) {
    return { success: false, error: 'Erreur lors de l\'enregistrement.' };
  }

  // Génération d'un token JWT signé, valable 15 minutes
  const token = await new SignJWT({ email, pseudo })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(SECRET);

  return { success: true, token };
}
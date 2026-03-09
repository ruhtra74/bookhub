import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// 1. On configure l'authentification avec les clés du fichier .env.local
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // On gère les sauts de ligne de la clé
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 2. On initialise la connexion au document
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

// 3. Fonction pour ajouter un utilisateur
export const appendUserToSheet = async (pseudo: string, email: string) => {
  try {
    // Charge les infos du document
    await doc.loadInfo(); 
    
    // Sélectionne la première feuille (index 0)
    const sheet = doc.sheetsByIndex[0]; 
    
    // Ajoute une ligne avec les données
    // Les clés (Date, Pseudo, Email) doivent correspondre exactement aux titres de tes colonnes
    await sheet.addRow({
      Date: new Date().toLocaleString('fr-FR'),
      Pseudo: pseudo,
      Email: email,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erreur Google Sheets:', error);
    return { success: false, error };
  }
};
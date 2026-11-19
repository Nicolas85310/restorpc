/**
 * RESTORPC - collecte et affichage des avis anonymes
 *
 * Feuille Google Sheets :
 * Colonne A : Date
 * Colonne B : Note / 5
 * Colonne C : Commentaire
 *
 * Déployer en tant qu'application Web :
 * Exécuter en tant que : Moi
 * Accès : Tout le monde
 */

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = (e && e.parameter) ? e.parameter : {};

  // Champ piège anti-robots
  if (data.website) {
    return ContentService.createTextOutput("OK");
  }

  const rating = Number(data.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return ContentService.createTextOutput("Erreur : note invalide");
  }

  const comment = String(data.comment || "").slice(0, 2000);
  sheet.appendRow([new Date(), rating, comment]);

  return ContentService.createTextOutput("OK");
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getValues();

  // Ignore la ligne d'en-tête et récupère les cinq avis les plus récents.
  const rows = values.slice(1).filter(row => {
    const rating = Number(row[1]);
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  }).slice(-5).reverse();

  const reviews = rows.map(row => ({
    rating: Number(row[1]),
    comment: String(row[2] || "")
  }));

  const payload = JSON.stringify({ reviews: reviews });
  const callback = e && e.parameter ? String(e.parameter.callback || "") : "";

  // JSONP pour permettre au site RESTORPC de lire les avis depuis son hébergement.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]{0,60}$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + payload + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

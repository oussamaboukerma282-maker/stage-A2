// Génération du PDF d'une fiche demande (OPT03) + QR code (OPT04).

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const PURPLE = '#5B2C8D';
const NAVY = '#1A237E';
const GRAY = '#555555';

const formaterDate = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Écrit le PDF de la fiche `demande` (+ historique) dans le flux `res`.
 * @param {string} urlPublique - URL de la demande, encodée dans le QR code
 */
const genererFicheDemande = async (res, demande, historique, urlPublique) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  // QR code (data URL -> buffer)
  let qrBuffer = null;
  try {
    const dataUrl = await QRCode.toDataURL(urlPublique, { margin: 1, width: 90 });
    qrBuffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  } catch { /* le PDF reste valide sans QR */ }

  // ---- En-tête ----
  doc.fillColor(PURPLE).fontSize(20).font('Helvetica-Bold')
     .text('Avis Juridiques — Natixis DAJ', 50, 50);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text('Fiche de demande d\'avis juridique', 50, 74);

  if (qrBuffer) {
    doc.image(qrBuffer, 470, 45, { width: 80 });
    doc.fillColor(GRAY).fontSize(7).text('Scanner pour', 470, 128, { width: 80, align: 'center' });
    doc.text('accéder en ligne', 470, 137, { width: 80, align: 'center' });
  }

  doc.moveTo(50, 100).lineTo(420, 100).strokeColor('#DDDDDD').stroke();

  // ---- Titre ----
  doc.fillColor(NAVY).fontSize(16).font('Helvetica-Bold')
     .text(`#${demande.id} — ${demande.titre}`, 50, 160);
  doc.fillColor(GRAY).fontSize(11).font('Helvetica')
     .text(`Statut : ${demande.statut}`, 50, 184);

  // ---- Informations ----
  let y = 220;
  const ligne = (label, valeur) => {
    doc.fillColor(GRAY).fontSize(10).font('Helvetica-Bold').text(label, 50, y, { width: 150 });
    doc.fillColor('#222222').font('Helvetica').text(valeur || '—', 200, y, { width: 345 });
    y += 22;
  };
  doc.fillColor(PURPLE).fontSize(12).font('Helvetica-Bold').text('Informations', 50, y);
  y += 22;
  ligne('Thème', demande.theme);
  ligne('Degré de sensibilité', demande.degre_sensibilite);
  ligne('Demandeur', `${demande.demandeur_prenom} ${demande.demandeur_nom}`);
  ligne('Structure', demande.demandeur_structure);
  ligne('Juriste en charge', demande.juriste_nom ? `${demande.juriste_prenom} ${demande.juriste_nom}` : '—');
  ligne('Créée le', formaterDate(demande.date_creation));
  ligne('Soumise le', formaterDate(demande.date_soumission));
  ligne('Traitée le', formaterDate(demande.date_traitement));

  // ---- Description ----
  y += 10;
  doc.fillColor(PURPLE).fontSize(12).font('Helvetica-Bold').text('Description', 50, y);
  y += 20;
  doc.fillColor('#222222').fontSize(10).font('Helvetica').text(demande.description, 50, y, { width: 495 });
  y = doc.y + 15;

  // ---- Avis / Motif ----
  if (demande.avis_juridique) {
    doc.fillColor('#1B5E20').fontSize(12).font('Helvetica-Bold').text('Avis juridique', 50, y);
    y += 20;
    doc.fillColor('#222222').fontSize(10).font('Helvetica').text(demande.avis_juridique, 50, y, { width: 495 });
    y = doc.y + 15;
  }
  if (demande.motif_rejet) {
    doc.fillColor('#B71C1C').fontSize(12).font('Helvetica-Bold').text('Motif du rejet', 50, y);
    y += 20;
    doc.fillColor('#222222').fontSize(10).font('Helvetica').text(demande.motif_rejet, 50, y, { width: 495 });
    y = doc.y + 15;
  }

  // ---- Journal d'activité ----
  if (historique && historique.length) {
    if (y > 680) { doc.addPage(); y = 50; }
    doc.fillColor(PURPLE).fontSize(12).font('Helvetica-Bold').text('Journal d\'activité', 50, y);
    y += 20;
    historique.forEach((h) => {
      if (y > 760) { doc.addPage(); y = 50; }
      // Helvetica (WinAnsi) ne contient pas la flèche « → » : on utilise « -> »
      const transition = h.ancien_statut ? `${h.ancien_statut} -> ${h.nouveau_statut}` : h.nouveau_statut;
      doc.fillColor('#222222').fontSize(9).font('Helvetica-Bold')
         .text(`${formaterDate(h.created_at)}  ·  ${transition}`, 50, y, { width: 495 });
      y = doc.y;
      doc.fillColor(GRAY).font('Helvetica').text(`par ${h.user_prenom} ${h.user_nom} (${h.user_role})`, 50, y, { width: 495 });
      y = doc.y + 6;
    });
  }

  // ---- Pied de page (position sûre dans la marge basse pour éviter une page vide) ----
  doc.fillColor('#999999').fontSize(8).font('Helvetica')
     .text(`Document généré le ${formaterDate(new Date().toISOString())} — Gestion des Avis Juridiques`,
            50, doc.page.height - 60, { width: 495, align: 'center', lineBreak: false });

  doc.end();
};

module.exports = { genererFicheDemande };

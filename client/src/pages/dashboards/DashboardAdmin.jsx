// Tableau de bord Administrateur : KPIs + 4 graphiques (Chart.js).
// Export : PNG par graphique + rapport PDF complet (KPIs + graphiques).

import { useEffect, useRef, useState } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// Palette cohérente avec StatutBadge
const COULEURS_STATUT = {
  'Brouillon': '#c4b5fd', 'Soumise': '#3b82f6', 'En cours': '#f59e0b',
  'Complément demandé': '#f97316', 'Validée': '#16a34a', 'Rejetée': '#dc2626', 'Annulée': '#9ca3af'
};
const COULEURS_SENSIBILITE = { 'Faible': '#16a34a', 'Moyen': '#f59e0b', 'Confidentiel': '#dc2626' };
const PALETTE = ['#5B2C8D', '#1A237E', '#00838F', '#E65100', '#7B1FA2'];

const optionsDonut = { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, maintainAspectRatio: false };
const optionsBar = { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } };
const optionsLine = { plugins: { legend: { display: false } }, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } };

// Icône « télécharger »
const IconeTelecharger = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
);

/**
 * Compose l'image d'un graphique sur un fond blanc (les canvas Chart.js sont
 * transparents) et renvoie { url, ratio } pour l'export PNG et PDF.
 */
const imageAvecFond = (chart) => new Promise((resolve) => {
  const src = chart.toBase64Image('image/png', 1);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    resolve({ url: c.toDataURL('image/png'), ratio: img.height / img.width });
  };
  img.src = src;
});

function Carte({ titre, onDownload, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{titre}</h3>
        {onDownload && (
          <button onClick={onDownload} title="Télécharger ce graphique (PNG)"
                  className="text-gray-400 hover:text-primaire dark:hover:text-purple-300 transition p-1">
            <IconeTelecharger />
          </button>
        )}
      </div>
      <div className="h-56">{children}</div>
    </div>
  );
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [genPdf, setGenPdf] = useState(false);

  // Références vers les instances Chart.js (pour l'export image)
  const refStatut = useRef(null);
  const refTheme = useRef(null);
  const refSensibilite = useRef(null);
  const refMensuel = useRef(null);

  useEffect(() => {
    api.get('/stats/admin')
      .then((res) => setStats(res.data.data))
      .catch(() => setErreur('Impossible de charger les statistiques.'));
  }, []);

  // --- Exports -------------------------------------------------------------
  const telechargerPNG = async (ref, nom) => {
    if (!ref.current) return;
    const { url } = await imageAvecFond(ref.current);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nom}.png`;
    a.click();
  };

  const telechargerRapport = async () => {
    if (!stats) return;
    setGenPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const M = 15, contentW = 210 - 2 * M;

      // En-tête
      doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(91, 44, 141);
      doc.text('Tableau de bord — Avis Juridiques', M, 20);
      doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(120);
      doc.text(`Rapport généré le ${new Date().toLocaleString('fr-FR')}`, M, 27);

      // KPIs (2 colonnes × 2 lignes)
      const kpis = [
        ['Total des demandes', String(stats.totalDemandes)],
        ['Délai moyen de traitement', stats.delaiMoyenJours != null ? `${stats.delaiMoyenJours} j` : '—'],
        ['Taux de validation', `${stats.tauxValidation} %  (rejet ${stats.tauxRejet} %)`],
        ['En retard (> 7 j)', String(stats.enRetard)]
      ];
      let y = 42;
      kpis.forEach((k, i) => {
        const x = M + (i % 2) * (contentW / 2);
        const yy = y + Math.floor(i / 2) * 16;
        doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120);
        doc.text(k[0], x, yy);
        doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(30);
        doc.text(k[1], x, yy + 7);
      });
      y += 40;

      // Graphiques (2 × 2)
      const charts = [
        [refStatut, 'Répartition par statut'],
        [refTheme, 'Demandes par thème'],
        [refSensibilite, 'Répartition par sensibilité'],
        [refMensuel, 'Évolution mensuelle']
      ];
      const cellW = contentW / 2 - 3;
      for (let r = 0; r < 2; r++) {
        let hauteurLigne = 0;
        for (let c = 0; c < 2; c++) {
          const [ref, label] = charts[r * 2 + c];
          if (!ref.current) continue;
          const { url, ratio } = await imageAvecFond(ref.current);
          const x = M + c * (contentW / 2 + 0);
          const h = cellW * ratio;
          doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(80);
          doc.text(label, x, y);
          doc.addImage(url, 'PNG', x, y + 2, cellW, h);
          hauteurLigne = Math.max(hauteurLigne, h);
        }
        y += hauteurLigne + 14;
      }

      // Pied de page
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(150);
      doc.text('Gestion des Avis Juridiques — Natixis Algeria, DAJ', M, 290);

      doc.save('tableau-de-bord.pdf');
    } finally {
      setGenPdf(false);
    }
  };

  if (erreur) return <p className="text-red-600">{erreur}</p>;
  if (!stats) return <p className="text-gray-400">Chargement du tableau de bord…</p>;

  const cles = (obj) => Object.keys(obj);
  const vals = (obj) => Object.values(obj);

  const dataStatut = {
    labels: cles(stats.parStatut),
    datasets: [{ data: vals(stats.parStatut), backgroundColor: cles(stats.parStatut).map((s) => COULEURS_STATUT[s] || '#9ca3af') }]
  };
  const dataTheme = {
    labels: cles(stats.parTheme),
    datasets: [{ data: vals(stats.parTheme), backgroundColor: PALETTE }]
  };
  const dataSensibilite = {
    labels: cles(stats.parSensibilite),
    datasets: [{ data: vals(stats.parSensibilite), backgroundColor: cles(stats.parSensibilite).map((s) => COULEURS_SENSIBILITE[s] || '#9ca3af') }]
  };
  const dataMensuel = {
    labels: stats.evolutionMensuelle.map((m) => m.mois),
    datasets: [{ data: stats.evolutionMensuelle.map((m) => m.total), borderColor: '#5B2C8D', backgroundColor: '#5B2C8D', tension: 0.3, fill: false }]
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-marine dark:text-purple-300">Tableau de bord</h1>
        <button onClick={telechargerRapport} disabled={genPdf}
          className="flex items-center gap-2 bg-primaire text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primaire/90 transition disabled:opacity-60">
          <IconeTelecharger />
          {genPdf ? 'Génération…' : 'Télécharger le rapport'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titre="Total des demandes" valeur={stats.totalDemandes} couleur="marine" />
        <StatCard titre="Délai moyen" valeur={stats.delaiMoyenJours != null ? `${stats.delaiMoyenJours} j` : '—'} sousTitre="soumission → traitement" couleur="primaire" />
        <StatCard titre="Taux de validation" valeur={`${stats.tauxValidation} %`} sousTitre={`Rejet : ${stats.tauxRejet} %`} couleur="vert" />
        <StatCard titre="En retard" valeur={stats.enRetard} sousTitre="> 7 jours, non clôturées" couleur="rouge" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Carte titre="Répartition par statut" onDownload={() => telechargerPNG(refStatut, 'repartition-par-statut')}>
          <Doughnut ref={refStatut} data={dataStatut} options={optionsDonut} />
        </Carte>
        <Carte titre="Demandes par thème" onDownload={() => telechargerPNG(refTheme, 'demandes-par-theme')}>
          <Bar ref={refTheme} data={dataTheme} options={optionsBar} />
        </Carte>
        <Carte titre="Répartition par sensibilité" onDownload={() => telechargerPNG(refSensibilite, 'repartition-par-sensibilite')}>
          <Doughnut ref={refSensibilite} data={dataSensibilite} options={optionsDonut} />
        </Carte>
        <Carte titre="Évolution mensuelle" onDownload={() => telechargerPNG(refMensuel, 'evolution-mensuelle')}>
          <Line ref={refMensuel} data={dataMensuel} options={optionsLine} />
        </Carte>
      </div>
    </div>
  );
}

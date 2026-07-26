// Tableau de bord Administrateur : KPIs + 4 graphiques (Chart.js).

import { useEffect, useState } from 'react';
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

function Carte({ titre, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold text-gray-700 text-sm mb-3">{titre}</h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api.get('/stats/admin')
      .then((res) => setStats(res.data.data))
      .catch(() => setErreur('Impossible de charger les statistiques.'));
  }, []);

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
      <h1 className="text-2xl font-bold text-marine mb-6">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard titre="Total des demandes" valeur={stats.totalDemandes} couleur="marine" />
        <StatCard titre="Délai moyen" valeur={stats.delaiMoyenJours != null ? `${stats.delaiMoyenJours} j` : '—'} sousTitre="soumission → traitement" couleur="primaire" />
        <StatCard titre="Taux de validation" valeur={`${stats.tauxValidation} %`} sousTitre={`Rejet : ${stats.tauxRejet} %`} couleur="vert" />
        <StatCard titre="En retard" valeur={stats.enRetard} sousTitre="> 7 jours, non clôturées" couleur="rouge" />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Carte titre="Répartition par statut"><Doughnut data={dataStatut} options={optionsDonut} /></Carte>
        <Carte titre="Demandes par thème"><Bar data={dataTheme} options={optionsBar} /></Carte>
        <Carte titre="Répartition par sensibilité"><Doughnut data={dataSensibilite} options={optionsDonut} /></Carte>
        <Carte titre="Évolution mensuelle"><Line data={dataMensuel} options={optionsLine} /></Carte>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <h1 className="text-5xl font-bold text-primaire">404</h1>
      <p className="text-gray-600">Page introuvable.</p>
      <Link to="/" className="text-primaire underline">Retour à l'accueil</Link>
    </div>
  );
}

// Page générique de remplacement pour les écrans construits dans les phases suivantes.

export default function Placeholder({ titre, phase }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-marine mb-2">{titre}</h1>
      <div className="mt-4 bg-white rounded-lg shadow p-6 text-gray-500">
        Cet écran sera développé en <span className="font-medium">{phase}</span>.
      </div>
    </div>
  );
}

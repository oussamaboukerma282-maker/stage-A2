// Sélecteur de pièce jointe avec validation côté client
// (le serveur revalide systématiquement — cf. CONVENTIONS §6).

import { useRef, useState } from 'react';

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'];

export const formaterTaille = (octets) => {
  if (octets == null) return '';
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
};

export default function FileUpload({ fichier, onChange, progression }) {
  const inputRef = useRef(null);
  const [erreur, setErreur] = useState(null);

  const choisir = (e) => {
    const f = e.target.files?.[0];
    setErreur(null);
    if (!f) return;

    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!EXTENSIONS.includes(ext)) {
      setErreur('Format non autorisé (PDF, DOCX, PNG ou JPG uniquement).');
      return;
    }
    if (f.size > MAX_SIZE) {
      setErreur('Le fichier dépasse la taille maximale de 10 Mo.');
      return;
    }
    onChange(f);
  };

  const retirer = () => {
    onChange(null);
    setErreur(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={choisir}
        accept={EXTENSIONS.join(',')}
        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md
                   file:border-0 file:bg-primaire file:text-white file:text-sm file:font-medium
                   hover:file:bg-primaire/90 file:cursor-pointer"
      />
      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PNG ou JPG — 10 Mo maximum.</p>

      {fichier && (
        <div className="mt-2 flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
          <span className="text-sm text-gray-700 truncate">
            {fichier.name} <span className="text-gray-400">({formaterTaille(fichier.size)})</span>
          </span>
          <button type="button" onClick={retirer} className="text-sm text-red-600 hover:underline ml-3">
            Retirer
          </button>
        </div>
      )}

      {typeof progression === 'number' && progression > 0 && progression < 100 && (
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primaire transition-all" style={{ width: `${progression}%` }} />
        </div>
      )}

      {erreur && <p className="text-red-600 text-sm mt-2">{erreur}</p>}
    </div>
  );
}

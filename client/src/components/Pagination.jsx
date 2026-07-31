// Pagination réutilisable — inspirée du modèle blocks.so :
// « ‹ Précédent  1  2  3  …  N  Suivant › » avec la page courante mise en évidence.
// N'affiche rien s'il n'y a qu'une seule page.

const ChevronGauche = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronDroite = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * Construit la liste des pages à afficher, avec des « … » pour les sauts.
 * Ex. (page 5, total 10) -> [1, '…', 4, 5, 6, '…', 10]
 * Petits totaux (≤ 7) : toutes les pages, sans ellipse.
 */
function pagesAffichees(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const cles = [...new Set([1, total, page, page - 1, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result = [];
  let prec = 0;
  for (const p of cles) {
    if (p - prec > 1) result.push('…');
    result.push(p);
    prec = p;
  }
  return result;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = pagesAffichees(page, totalPages);

  const nav =
    'inline-flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium ' +
    'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition ' +
    'disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed';
  const numBase =
    'min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg text-sm font-medium transition';

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Pagination">
      <button className={nav} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronGauche />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="min-w-9 h-9 inline-flex items-center justify-center text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${numBase} ${
              p === page
                ? 'bg-primaire text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button className={nav} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <span className="hidden sm:inline">Suivant</span>
        <ChevronDroite />
      </button>
    </nav>
  );
}

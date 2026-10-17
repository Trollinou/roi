import React, { useState, useEffect } from 'react';
import { decodeEntities } from '@wordpress/html-entities';
import { normalizeText } from '../utils/suiviHelpers';
import type { CandidateStudent, StudentProgress } from '../../types/api/progression';

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (_student: StudentProgress) => void;
  apiUrl: string;
  nonce: string;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onStudentAdded,
  apiUrl,
  nonce,
}: AddStudentModalProps): React.JSX.Element | null {
  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {return;}

    setLoading(true);
    setError(null);
    fetch(`${apiUrl}/progression/candidats`, {
      headers: { 'X-WP-Nonce': nonce },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des adhérents.');
        }
        return res.json();
      })
      .then((data: CandidateStudent[]) => {
        setCandidates(data || []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen, apiUrl, nonce]);

  if (!isOpen) {return null;}

  const filteredCandidates = candidates.filter((cand) => {
    const name = normalizeText(
      `${cand.prenom || ''} ${cand.nom || ''} ${cand.display_name || ''} ${cand.email || ''}`
    );
    return name.includes(normalizeText(searchQuery));
  });

  const handleAdd = async (adherentId: number) => {
    setAddingId(adherentId);
    try {
      const res = await fetch(`${apiUrl}/progression/ajouter-eleve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({ adherent_id: adherentId }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success && resJson.student) {
        onStudentAdded(resJson.student);
        onClose();
      } else {
        alert(resJson.message || "Impossible d'ajouter cet élève.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de l'ajout de l'élève.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div
      className="roi-add-student-modal-overlay"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div className="roi-add-student-modal" role="document">
        {/* HEADER */}
        <div className="roi-add-student-modal__header">
          <h2 className="roi-add-student-modal__title">
            Ajouter un élève au suivi
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="roi-add-student-modal__close-btn"
          >
            ✕
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="roi-add-student-modal__search-wrap">
          <input
            type="search"
            placeholder="Rechercher un adhérent par nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="roi-add-student-modal__search-input"
          />
        </div>

        {/* CANDIDATES LIST */}
        <div className="roi-add-student-modal__list">
          {loading && (
            <div className="roi-add-student-modal__empty">
              Chargement des adhérents du club...
            </div>
          )}

          {error && (
            <div className="notice notice-error roi-suivi-notice">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredCandidates.length === 0 && (
            <div className="roi-add-student-modal__empty">
              {searchQuery
                ? 'Aucun adhérent ne correspond à cette recherche.'
                : 'Tous les adhérents du club sont déjà suivis.'}
            </div>
          )}

          {!loading &&
            filteredCandidates.map((cand) => {
              const isAdding = addingId === cand.id;
              return (
                <div
                  key={cand.id}
                  className="roi-add-student-modal__candidate"
                >
                  <div>
                    <div className="roi-add-student-modal__candidate-name">
                      {decodeEntities(cand.display_name)}
                    </div>
                    <div className="roi-add-student-modal__candidate-meta">
                      <span>Adhérent #{cand.id}</span>
                      {cand.birth_date ? (
                        <span>
                          • Né(e) le{' '}
                          {cand.birth_date.split('-').reverse().join('/')}
                        </span>
                      ) : null}
                      {cand.legal_rep ? (
                        <span>
                          • Resp :{' '}
                          <strong>{decodeEntities(cand.legal_rep)}</strong>
                        </span>
                      ) : null}
                      {cand.email ? <span>• {cand.email}</span> : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(cand.id)}
                    disabled={isAdding || addingId !== null}
                    className="roi-add-student-modal__add-btn"
                  >
                    {isAdding ? 'Ajout...' : '＋ Ajouter au suivi'}
                  </button>
                </div>
              );
            })}
        </div>

        {/* FOOTER */}
        <div className="roi-add-student-modal__footer">
          <a
            href="post-new.php?post_type=adherent"
            target="_blank"
            rel="noopener noreferrer"
            className="roi-add-student-modal__dame-link"
          >
            ＋ Créer un nouvel adhérent dans DAME ↗
          </a>

          <button
            type="button"
            onClick={onClose}
            className="button button-secondary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

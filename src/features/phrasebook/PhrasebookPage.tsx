import { useState } from 'react';
import { Search, Volume2, ChevronLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { phrases } from '../../data/phrases';
import { PHRASE_CATEGORIES } from '../../lib/constants';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import type { PhraseCategory } from '../../types';

export function PhrasebookPage() {
  const [selectedCategory, setSelectedCategory] = useState<PhraseCategory | null>(null);
  const [search, setSearch] = useState('');
  const { speak, isSupported } = useSpeechSynthesis();

  const filteredPhrases = phrases.filter((p) => {
    const matchesCat = selectedCategory ? p.category === selectedCategory : true;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.polish.toLowerCase().includes(q) || p.romaji.toLowerCase().includes(q) || p.japanese.includes(q);
    return matchesCat && matchesSearch;
  });

  const categoryPhrases = (cat: PhraseCategory) => phrases.filter((p) => p.category === cat);

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Rozmówki japońskie" subtitle={selectedCategory ? PHRASE_CATEGORIES[selectedCategory].label : 'Wybierz kategorię'} />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj frazy..."
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Categories grid (when not in category and no search) */}
        {!selectedCategory && !search && (
          <>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)' }}>KATEGORIE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(Object.entries(PHRASE_CATEGORIES) as [PhraseCategory, { label: string; emoji: string }][]).map(([cat, info]) => (
                <button
                  key={cat}
                  className="card btn"
                  onClick={() => setSelectedCategory(cat)}
                  style={{ flexDirection: 'column', gap: 6, padding: '16px 12px', alignItems: 'flex-start' }}
                >
                  <span style={{ fontSize: 28 }}>{info.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{info.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {categoryPhrases(cat).length} fraz
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Back button in category view */}
        {selectedCategory && !search && (
          <button
            className="btn btn-ghost"
            onClick={() => setSelectedCategory(null)}
            style={{ alignSelf: 'flex-start', padding: '6px 0', minHeight: 36 }}
          >
            <ChevronLeft size={18} />
            Wszystkie kategorie
          </button>
        )}

        {/* Phrases list */}
        {(selectedCategory || search) && (
          <>
            {filteredPhrases.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div>Nie znaleziono frazy</div>
              </div>
            ) : (
              filteredPhrases.map((phrase) => (
                <div key={phrase.id} className="phrase-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
                        {phrase.polish}
                      </div>
                      <div style={{ fontSize: 22, marginTop: 4, lineHeight: 1.4 }}>
                        {phrase.japanese}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-primary)', fontStyle: 'italic', marginTop: 2 }}>
                        {phrase.romaji}
                      </div>
                    </div>
                    {isSupported && (
                      <button
                        onClick={() => speak(phrase.japanese)}
                        className="btn btn-ghost"
                        style={{ minHeight: 40, padding: '8px 10px', flexShrink: 0, marginLeft: 8, color: 'var(--color-primary)' }}
                        aria-label="Odtwórz wymowę"
                      >
                        <Volume2 size={20} />
                      </button>
                    )}
                  </div>
                  {search && !selectedCategory && (
                    <div style={{
                      marginTop: 6,
                      alignSelf: 'flex-start',
                      background: 'var(--color-border)',
                      padding: '2px 8px',
                      borderRadius: 100,
                      fontSize: 11,
                    }}>
                      {PHRASE_CATEGORIES[phrase.category].emoji} {PHRASE_CATEGORIES[phrase.category].label}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* All phrases button */}
        {!selectedCategory && !search && (
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedCategory('ogolne')}
            style={{ width: '100%', marginTop: 4 }}
          >
            Przeglądaj wszystkie frazy
          </button>
        )}

      </div>
    </div>
  );
}

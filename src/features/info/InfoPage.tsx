import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { Header } from '../../components/Header';
import { japanInfo } from '../../data/japanInfo';

function Accordion({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: '0 16px' }}>
      <button className="accordion-btn" onClick={() => setOpen(!open)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          {title}
        </span>
        {open ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </div>
  );
}

export function InfoPage() {
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Przydatne informacje" subtitle="Japonia – przewodnik podróżnika" />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        <Accordion title="Etykieta i kultura" emoji="🎎">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {japanInfo.etiquette.map((item, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div>{item.content}</div>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Numery alarmowe" emoji="🚨">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {japanInfo.emergency.map((e, i) => (
              <div key={i} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <Phone size={16} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{e.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1.2 }}>{e.number}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Przydatne aplikacje" emoji="📱">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {japanInfo.usefulApps.map((app, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14, marginBottom: 2 }}>
                  {app.name}
                </div>
                <div>{app.desc}</div>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Transport w Japonii" emoji="🚆">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {japanInfo.transport.map((item, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div>{item.content}</div>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Listopad w Japonii 🍁" emoji="🍂">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {japanInfo.november.map((item, i) => (
              <div key={i}>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14, marginBottom: 2 }}>
                  {item.title}
                </div>
                <div>{item.content}</div>
              </div>
            ))}
          </div>
        </Accordion>

        {/* Useful vocab card */}
        <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>🗾 Kilka słów po japońsku</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { pl: 'Dziękuję', jp: 'ありがとう', rom: 'Arigatou' },
              { pl: 'Przepraszam', jp: 'すみません', rom: 'Sumimasen' },
              { pl: 'Pyszne!', jp: 'おいしい！', rom: 'Oishii!' },
              { pl: 'Ile to kosztuje?', jp: 'いくらですか？', rom: 'Ikura desu ka?' },
              { pl: 'Gdzie jest...?', jp: 'どこですか？', rom: 'Doko desu ka?' },
            ].map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none', paddingBottom: i < 4 ? 6 : 0 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{w.pl}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{w.jp}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-primary)', fontStyle: 'italic' }}>{w.rom}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

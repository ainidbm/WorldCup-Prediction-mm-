import type { MatchPrediction } from '../data/loader';

interface Props {
  match: MatchPrediction;
}

function getBadgeClass(prob: number): string {
  if (prob >= 0.5) return 'badge-green';
  if (prob >= 0.35) return 'badge-amber';
  return 'badge-rose';
}

export default function MatchCard({ match }: Props) {
  const pctA = (match.probA * 100).toFixed(1);
  const pctD = (match.probDraw * 100).toFixed(1);
  const pctB = (match.probB * 100).toFixed(1);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{match.teamA}</span>
        <span className="badge badge-blue">{match.round}</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{match.teamB}</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className={`badge ${getBadgeClass(match.probA)}`} style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
            {pctA}%
          </span>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>胜</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className="badge badge-amber" style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
            {pctD}%
          </span>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>平</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className={`badge ${getBadgeClass(match.probB)}`} style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
            {pctB}%
          </span>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>负</div>
        </div>
      </div>

      <div className="prob-bar">
        <div style={{ display: 'flex', height: '100%' }}>
          <div
            className="prob-bar-fill"
            style={{ width: `${pctA}%`, background: '#4ade80' }}
          />
          <div
            className="prob-bar-fill"
            style={{ width: `${pctD}%`, background: '#fbbf24' }}
          />
          <div
            className="prob-bar-fill"
            style={{ width: `${pctB}%`, background: '#fb7185' }}
          />
        </div>
      </div>

      {match.keyFactors && match.keyFactors.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {match.keyFactors.map((factor, i) => (
            <span
              key={i}
              className="badge badge-blue"
              style={{ fontSize: '0.7rem' }}
            >
              {factor}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import type { StageProb, MatchPrediction } from '../data/loader';

interface Props {
  matches: MatchPrediction[];
  stageProb: Record<string, StageProb>;
}

function BracketNode({
  team,
  prob,
  isWinner,
}: {
  team: string;
  prob: number;
  isWinner: boolean;
}) {
  return (
    <div
      style={{
        padding: '0.4rem 0.8rem',
        background: isWinner ? 'rgba(74, 222, 128, 0.15)' : 'rgba(51, 65, 85, 0.5)',
        borderRadius: 6,
        border: isWinner ? '1px solid #4ade80' : '1px solid #334155',
        fontSize: '0.85rem',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem',
        minWidth: 140,
      }}
    >
      <span style={{ fontWeight: 600 }}>{team}</span>
      <span style={{ color: '#94a3b8' }}>{(prob * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function BracketView({ matches, stageProb }: Props) {
  // 按 16 强对阵分组展示
  const r16Matches = matches.filter((m) => m.round === '16强');

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {r16Matches.map((m) => {
          const probA = stageProb[m.teamA];
          const probB = stageProb[m.teamB];
          const winnerA = m.probA >= m.probB;

          return (
            <div
              key={m.matchId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: 8,
                border: '1px solid #334155',
              }}
            >
              <BracketNode
                team={m.teamA}
                prob={probA?.quarter ?? 0}
                isWinner={winnerA}
              />
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>VS</div>
              <BracketNode
                team={m.teamB}
                prob={probB?.quarter ?? 0}
                isWinner={!winnerA}
              />
              <div style={{ textAlign: 'center', marginTop: '0.3rem' }}>
                <span className="badge badge-blue">{m.matchId.replace('R16_', '第 ')}场</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 晋级概率汇总表 */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '0.75rem' }}>各阶段晋级概率</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#94a3b8' }}>球队</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>8 强</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>4 强</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>决赛</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: '#94a3b8' }}>夺冠</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stageProb)
                .sort((a, b) => b[1].champion - a[1].champion)
                .map(([team, probs]) => (
                  <tr key={team} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{team}</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>{(probs.quarter * 100).toFixed(0)}%</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>{(probs.semi * 100).toFixed(0)}%</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>{(probs.final * 100).toFixed(0)}%</td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: '#fbbf24', fontWeight: 700 }}>
                      {(probs.champion * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

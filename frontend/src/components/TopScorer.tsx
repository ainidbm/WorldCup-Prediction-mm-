import type { TopScorer as TopScorerType } from '../data/loader';

interface Props {
  data: TopScorerType[];
}

const CONFIDENCE_COLOR: Record<string, string> = {
  '高': '#10b981',     // 绿
  '中': '#fbbf24',     // 黄
  '低': '#ef4444',     // 红
  '已锁定': '#6b7280', // 灰
};

export default function TopScorer({ data }: Props) {
  return (
    <div className="card">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>#</th>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>球员</th>
              <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>球队</th>
              <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>已进球</th>
              <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>预测总进球</th>
              <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>置信度</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => {
              const conf = s.confidence || '中';
              const confColor = CONFIDENCE_COLOR[conf] || '#94a3b8';
              return (
                <tr
                  key={s.player}
                  style={{
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                    background: i < 3 ? 'rgba(251, 191, 36, 0.05)' : undefined,
                  }}
                >
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, color: i < 3 ? '#fbbf24' : '#94a3b8' }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{s.player}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#94a3b8' }}>{s.team}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{s.existingGoals}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: i < 3 ? '#fbbf24' : '#38bdf8',
                      }}
                    >
                      {s.predictedGoals}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#fff',
                        background: confColor,
                      }}
                    >
                      {conf}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

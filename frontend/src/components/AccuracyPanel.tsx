import type { AccuracyData } from '../data/loader';

interface Props {
  data: AccuracyData;
}

export default function AccuracyPanel({ data }: Props) {
  return (
    <div className="card">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8' }}>
            {(data.overallAccuracy * 100).toFixed(1)}%
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>综合准确率</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {data.correctPredictions}/{data.totalMatchesEvaluated} 场
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4ade80' }}>
            {(data.groupStageAccuracy * 100).toFixed(1)}%
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>小组赛准确率</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {data.groupMatches} 场
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24' }}>
            {(data.knockoutAccuracy * 100).toFixed(1)}%
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>淘汰赛准确率</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {data.knockoutMatches} 场
          </div>
        </div>

      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 8,
          border: '1px solid #334155',
        }}
      >
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7 }}>
          {data.calibrationNote}
        </p>
      </div>
    </div>
  );
}

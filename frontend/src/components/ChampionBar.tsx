import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ChampionProb } from '../data/loader';

const COLORS = [
  '#38bdf8', '#4ade80', '#fbbf24', '#fb7185',
  '#a78bfa', '#34d399', '#f97316', '#06b6d4',
  '#8b5cf6', '#10b981', '#ef4444', '#6366f1',
  '#14b8a6', '#f59e0b', '#ec4899', '#84cc16',
];

interface Props {
  data: ChampionProb[];
}

export default function ChampionBar({ data }: Props) {
  const top16 = data.slice(0, 16).map((d) => ({
    team: d.team,
    prob: +(d.prob * 100).toFixed(1),
  }));

  return (
    <div className="card">
      <ResponsiveContainer width="100%" height={top16.length * 36}>
        <BarChart data={top16} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis
            type="number"
            domain={[0, 'auto']}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="team"
            width={80}
            tick={{ fill: '#f1f5f9', fontSize: 13 }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, '夺冠概率']}
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#f1f5f9',
            }}
          />
          <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
            {top16.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useEffect, useState, lazy, Suspense } from 'react';
import { loadPredictions, loadAccuracy } from './data/loader';
import type { PredictionsData, AccuracyData } from './data/loader';
const ChampionBar = lazy(() => import('./components/ChampionBar'));
import KnockoutProgress from './components/KnockoutProgress';
import TopScorer from './components/TopScorer';
import AccuracyPanel from './components/AccuracyPanel';
import './styles/global.css';

export default function App() {
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pred, acc] = await Promise.all([loadPredictions(), loadAccuracy()]);
        setPredictions(pred);
        setAccuracy(acc);
      } catch (e: any) {
        setError(e.message || '数据加载失败');
      }
    }
    loadData();
  }, []);

  if (error) {
    return (
      <div className="container">
        <div className="header">
          <h1>2026 世界杯冠军预测</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', color: '#fb7185' }}>
          <p style={{ fontSize: '1.1rem' }}>数据加载失败</p>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9rem' }}>{error}</p>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            请确保 predictions.json 和 accuracy.json 已生成到 public 目录
          </p>
        </div>
      </div>
    );
  }

  if (!predictions || !accuracy) {
    return <div className="loading">加载预测数据中...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>2026 世界杯冠军预测</h1>
        <p>
          基于随机森林 + 蒙特卡洛模拟 (10,000 次) | 生成时间:{' '}
          {new Date(predictions.generatedAt).toLocaleString('zh-CN')}
        </p>
      </div>

      <div className="section">
        <h2 className="section-title">夺冠概率排行</h2>
        <Suspense fallback={<div className="loading">加载图表...</div>}>
          <ChampionBar data={predictions.championProb} />
        </Suspense>
      </div>

      <div className="section">
        <h2 className="section-title">淘汰赛晋级图</h2>
        {predictions.knockoutBracket && (
          <KnockoutProgress bracket={predictions.knockoutBracket} />
        )}
      </div>

      <div className="section">
        <h2 className="section-title">最佳射手预测 Top 10</h2>
        <TopScorer data={predictions.topScorers} />
      </div>

      <div className="section">
        <h2 className="section-title">模型准确率</h2>
        <AccuracyPanel data={accuracy} />
      </div>

      <footer style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '2rem', paddingBottom: '1rem' }}>
        仅供娱乐和球迷讨论，严禁用于任何投注用途 | Powered by Random Forest + Monte Carlo Simulation
      </footer>
    </div>
  );
}

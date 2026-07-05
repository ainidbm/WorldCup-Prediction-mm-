import { useRef, useEffect, useState, useCallback } from 'react';
import type { KnockoutBracket, KnockoutMatch } from '../data/loader';

interface Props {
  bracket: KnockoutBracket;
}

/* ── bracket structure: which matches feed into which ── */
const FEEDER_MAP: Record<string, [string, string]> = {
  QF_1: ['R16_1', 'R16_4'], QF_2: ['R16_3', 'R16_6'],
  QF_3: ['R16_2', 'R16_5'], QF_4: ['R16_7', 'R16_8'],
  QF_5: ['R16_12', 'R16_11'], QF_6: ['R16_10', 'R16_9'],
  QF_7: ['R16_15', 'R16_14'], QF_8: ['R16_13', 'R16_16'],
  SF_1: ['QF_2', 'QF_1'], SF_2: ['QF_5', 'QF_6'],
  SF_3: ['QF_3', 'QF_4'], SF_4: ['QF_7', 'QF_8'],
  F_1: ['SF_1', 'SF_2'], F_2: ['SF_3', 'SF_4'],
  CHAMP: ['F_1', 'F_2'],
};

/* ── single match card ── */
function MatchCard({ match }: { match: KnockoutMatch }) {
  const done = match.completed;
  const isPenalty = done && match.penaltyScoreA !== undefined;
  const aWin = done && match.winner === match.teamA;
  const bWin = done && match.winner === match.teamB;

  const cls = (isWinner: boolean, tbd: boolean) =>
    ['match-team', isWinner && 'winner', tbd && 'tbd'].filter(Boolean).join(' ');

  return (
    <div className={`match-card${done ? ' done' : ''}`} data-match-id={match.id}>
      <div className={cls(aWin, match.teamA === '待定')}>
        <span className="name">{match.teamA}</span>
        {done ? (
          <span className="score">
            {match.scoreA}
            {isPenalty && <span className="match-penalty">({match.penaltyScoreA})</span>}
          </span>
        ) : match.probA != null ? (
          <span className={`prob${match.probA >= (match.probB ?? 0) ? ' high' : ''}`}>
            {(match.probA * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>
      <div className={cls(bWin, match.teamB === '待定')}>
        <span className="name">{match.teamB}</span>
        {done ? (
          <span className="score">
            {match.scoreB}
            {isPenalty && <span className="match-penalty">({match.penaltyScoreB})</span>}
          </span>
        ) : match.probB != null ? (
          <span className={`prob${match.probB >= (match.probA ?? 0) ? ' high' : ''}`}>
            {(match.probB * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── SVG connector column between two round columns ── */
function ConnectorCol({
  leftRef,
  rightRef,
  containerRef,
}: {
  leftRef: React.RefObject<HTMLDivElement | null>;
  rightRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [paths, setPaths] = useState<string[]>([]);

  const recalc = useCallback(() => {
    const lc = leftRef.current;
    const rc = rightRef.current;
    const cc = containerRef.current;
    if (!lc || !rc || !cc) return;

    const ccRect = cc.getBoundingClientRect();
    const rightCards = rc.querySelectorAll<HTMLElement>('.match-card');
    const newPaths: string[] = [];

    rightCards.forEach((rcEl) => {
      const rcId = rcEl.getAttribute('data-match-id') || '';
      const feeders = FEEDER_MAP[rcId];
      if (!feeders) return;

      const rcRect = rcEl.getBoundingClientRect();
      const rcMidY = rcRect.top + rcRect.height / 2 - ccRect.top;

      const f1 = lc.querySelector(`[data-match-id="${feeders[0]}"]`) as HTMLElement | null;
      const f2 = lc.querySelector(`[data-match-id="${feeders[1]}"]`) as HTMLElement | null;
      if (!f1 || !f2) return;

      const f1R = f1.getBoundingClientRect();
      const f2R = f2.getBoundingClientRect();
      const y1 = f1R.top + f1R.height / 2 - ccRect.top;
      const y2 = f2R.top + f2R.height / 2 - ccRect.top;

      // Two horizontal stubs from left, joined by vertical, then one stub to right
      newPaths.push(`M0,${y1} H14 V${y2} H0`);
      newPaths.push(`M14,${rcMidY} H28`);
    });

    setPaths(newPaths);
  }, [leftRef, rightRef, containerRef]);

  useEffect(() => {
    // Initial calc + observer for resize
    const timer = setTimeout(recalc, 50);
    const obs = new ResizeObserver(recalc);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [recalc, containerRef]);

  return (
    <div className="bracket-connectors">
      <svg width="28" height="100%" style={{ overflow: 'visible' }}>
        {paths.map((d, i) => (
          <path key={i} d={d} stroke="#475569" strokeWidth="1.5" fill="none" />
        ))}
      </svg>
    </div>
  );
}

/* ── main bracket ── */
export default function KnockoutProgress({ bracket }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const roundRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (!bracket?.rounds?.length) return null;
  const { rounds } = bracket;

  // Connector pairs: [leftRoundIndex, rightRoundIndex]
  // Rounds: 0=16强, 1=8强, 2=4强, 3=决赛, 4=季军赛, 5=冠军赛
  // Connectors between: 0→1, 1→2, 2→3 (skip 3→4, 3→5)
  const connectorPairs: [number, number][] = [];
  for (let i = 0; i < rounds.length - 1; i++) {
    const next = rounds[i + 1].name;
    if (next === '季军赛' || next === '冠军赛') continue;
    connectorPairs.push([i, i + 1]);
  }

  return (
    <div className="card bracket-scroll">
      <div className="bracket" ref={containerRef}>
        {rounds.map((round, ri) => (
          <div key={round.name} style={{ display: 'contents' }}>
            {/* Insert connector before this round if needed */}
            {connectorPairs.some(([, r]) => r === ri) && ready && (
              <ConnectorCol
                leftRef={{ current: roundRefs.current[connectorPairs.find(([, r]) => r === ri)![0]] }}
                rightRef={{ current: roundRefs.current[ri] }}
                containerRef={containerRef}
              />
            )}
            <div
              className="bracket-round"
              ref={(el) => { roundRefs.current[ri] = el; }}
            >
              <div className="round-header">{round.name}</div>
              <div className="round-matches">
                {round.matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

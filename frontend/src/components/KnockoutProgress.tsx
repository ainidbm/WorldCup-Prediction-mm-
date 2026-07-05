import type { KnockoutBracket, KnockoutMatch } from '../data/loader';

interface Props {
  bracket: KnockoutBracket;
}

function MatchBox({ match }: { match: KnockoutMatch }) {
  const isCompleted = match.completed;
  const isPenalty = isCompleted && match.penaltyScoreA !== undefined;

  const teamAIsWinner = isCompleted && match.winner === match.teamA;
  const teamBIsWinner = isCompleted && match.winner === match.teamB;

  const teamStyle = (isWinner: boolean) => ({
    padding: '0.35rem 0.6rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    background: isWinner ? 'rgba(74, 222, 128, 0.12)' : 'rgba(51, 65, 85, 0.4)',
    borderRadius: 4,
    borderLeft: isWinner ? '3px solid #4ade80' : '3px solid transparent',
    fontSize: '0.82rem',
    minWidth: 0,
  });

  const nameStyle = (isWinner: boolean) => ({
    fontWeight: isWinner ? 700 : 500,
    color: isWinner ? '#4ade80' : '#e2e8f0',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    minWidth: 0,
  });

  const scoreStyle = {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#f1f5f9',
    flexShrink: 0,
  };

  const probStyle = (higher: boolean) => ({
    fontSize: '0.75rem',
    fontWeight: higher ? 700 : 400,
    color: higher ? '#4ade80' : '#94a3b8',
    flexShrink: 0,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '0.5rem',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        border: isCompleted ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid #334155',
      }}
    >
      {/* Team A */}
      <div style={teamStyle(teamAIsWinner)}>
        <span style={nameStyle(teamAIsWinner)}>{match.teamA}</span>
        {isCompleted ? (
          <span style={scoreStyle}>
            {match.scoreA}
            {isPenalty && <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}> ({match.penaltyScoreA})</span>}
          </span>
        ) : match.probA !== undefined ? (
          <span style={probStyle(match.probA >= (match.probB ?? 0))}>{(match.probA * 100).toFixed(0)}%</span>
        ) : null}
      </div>

      {/* Team B */}
      <div style={teamStyle(teamBIsWinner)}>
        <span style={nameStyle(teamBIsWinner)}>{match.teamB}</span>
        {isCompleted ? (
          <span style={scoreStyle}>
            {match.scoreB}
            {isPenalty && <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}> ({match.penaltyScoreB})</span>}
          </span>
        ) : match.probB !== undefined ? (
          <span style={probStyle(match.probB >= (match.probA ?? 0))}>{(match.probB * 100).toFixed(0)}%</span>
        ) : null}
      </div>
    </div>
  );
}

export default function KnockoutProgress({ bracket }: Props) {
  if (!bracket?.rounds?.length) return null;

  return (
    <div className="card" style={{ overflowX: 'auto', padding: '1rem 0.5rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          minWidth: 'max-content',
          padding: '0 0.5rem',
          alignItems: 'flex-start',
        }}
      >
        {bracket.rounds.map((round) => (
          <div
            key={round.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minWidth: 170,
              maxWidth: 200,
            }}
          >
            {/* Round header */}
            <div
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#38bdf8',
                padding: '0.3rem 0',
                borderBottom: '2px solid #334155',
                marginBottom: '0.25rem',
              }}
            >
              {round.name}
            </div>

            {/* Matches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {round.matches.map((match) => (
                <MatchBox key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

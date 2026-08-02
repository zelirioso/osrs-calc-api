import { useState, type FormEvent } from 'react';
import { HERB_NAMES, type HerbQuantities, type HerbloreResponse } from './types';

const ZERO_HERBS = HERB_NAMES.reduce(
  (acc, herb) => ({ ...acc, [herb]: 0 }),
  {} as HerbQuantities,
);

export function HerbloreCalculator() {
  const [currentXp, setCurrentXp] = useState(0);
  const [targetLevel, setTargetLevel] = useState(1);
  const [herbs, setHerbs] = useState<HerbQuantities>(ZERO_HERBS);
  const [result, setResult] = useState<HerbloreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const response = await fetch('/api/calculators/herblore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_xp: currentXp,
        target_level: targetLevel,
        herbs,
      }),
    });

    if (!response.ok) {
      setError(`Request failed (${response.status})`);
      return;
    }

    setResult(await response.json());
  }

  return (
    <div className="calculator">
      <h1>Herblore Calculator</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Current XP
          <input
            type="number"
            data-testid="current-xp-input"
            value={currentXp}
            min={0}
            onChange={(event) => setCurrentXp(Number(event.target.value))}
          />
        </label>

        <label>
          Target level
          <input
            type="number"
            data-testid="target-level-input"
            value={targetLevel}
            min={1}
            max={99}
            onChange={(event) => setTargetLevel(Number(event.target.value))}
          />
        </label>

        <fieldset>
          <legend>Herbs banked</legend>
          <div className="herb-grid">
            {HERB_NAMES.map((herb) => (
              <label key={herb}>
                {herb.replace('_', ' ')}
                <input
                  type="number"
                  data-testid={`herb-input-${herb}`}
                  value={herbs[herb]}
                  min={0}
                  onChange={(event) =>
                    setHerbs((prev) => ({ ...prev, [herb]: Number(event.target.value) }))
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" data-testid="submit-button">
          Calculate
        </button>
      </form>

      {error && <p data-testid="error-message">{error}</p>}

      {result && (
        <div data-testid="result" className="result">
          <p>
            XP banked: <span data-testid="xp-banked">{result.xp_banked}</span>
          </p>
          <p>
            XP needed: <span data-testid="xp-needed">{result.xp_needed}</span>
          </p>
          <p>
            XP remaining: <span data-testid="xp-remaining">{result.xp_remaining}</span>
          </p>
          <p>
            XP surplus: <span data-testid="xp-surplus">{result.xp_surplus}</span>
          </p>

          <table>
            <thead>
              <tr>
                <th>Herb</th>
                <th>Qty</th>
                <th>XP/potion</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((item) => (
                <tr key={item.herb}>
                  <td>{item.herb}</td>
                  <td>{item.quantity}</td>
                  <td>{item.xp_per_potion}</td>
                  <td>{item.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

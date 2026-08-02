import { useState, type SubmitEvent } from 'react';
import { levelAt, xpAt } from '../../core/xpTable';
import { HERB_NAMES, type HerbQuantities, type HerbloreResponse } from './types';

type HerbQuantityInputs = Record<keyof HerbQuantities, string>;

const ZERO_HERBS = HERB_NAMES.reduce(
  (acc, herb) => ({ ...acc, [herb]: '0' }),
  {} as HerbQuantityInputs,
);

// Strips redundant leading zeros (e.g. "07" -> "7") without touching a lone "0".
function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}

export function HerbloreCalculator() {
  const [currentXp, setCurrentXp] = useState('0');
  const [currentLevel, setCurrentLevel] = useState(String(levelAt(0)));
  const [targetLevel, setTargetLevel] = useState('1');
  const [herbs, setHerbs] = useState<HerbQuantityInputs>(ZERO_HERBS);
  const [result, setResult] = useState<HerbloreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const response = await fetch('/api/calculators/herblore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_xp: Number(currentXp),
        target_level: Number(targetLevel),
        herbs: HERB_NAMES.reduce(
          (acc, herb) => ({ ...acc, [herb]: Number(herbs[herb]) }),
          {} as HerbQuantities,
        ),
      }),
    });

    if (!response.ok) {
      setError(`Request failed (${response.status})`);
      return;
    }

    setResult(await response.json());
  }

  // current level is a UI convenience only -- it's never sent to the
  // backend, only current_xp is. Level -> XP can only give the level's
  // starting threshold (an approximation), since a level is a range of
  // XP, not a single value; XP -> level is fully precise.
  function handleCurrentXpChange(value: string) {
    const stripped = stripLeadingZeros(value);
    setCurrentXp(stripped);

    const xp = Number(stripped);
    if (!Number.isNaN(xp)) {
      setCurrentLevel(String(levelAt(xp)));
    }
  }

  function handleCurrentLevelChange(value: string) {
    const stripped = stripLeadingZeros(value);
    setCurrentLevel(stripped);

    const level = Number(stripped);
    if (!Number.isNaN(level) && level >= 1 && level <= 99) {
      setCurrentXp(String(xpAt(level)));
    }
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
            max={200_000_000}
            onChange={(event) => handleCurrentXpChange(event.target.value)}
          />
        </label>

        <label>
          Current level (fills XP with the level's starting threshold)
          <input
            type="number"
            data-testid="current-level-input"
            value={currentLevel}
            min={1}
            max={99}
            onChange={(event) => handleCurrentLevelChange(event.target.value)}
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
            onChange={(event) => setTargetLevel(stripLeadingZeros(event.target.value))}
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
                    setHerbs((prev) => ({
                      ...prev,
                      [herb]: stripLeadingZeros(event.target.value),
                    }))
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

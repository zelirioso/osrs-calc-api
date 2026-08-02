import { useState, type SubmitEvent } from 'react';
import { levelAt, xpAt } from '../../core/xpTable';
import { formatNumber, stripLeadingZeros } from '../../lib/inputFormatting';
import type { FletchingResponse } from './types';

export function FletchingCalculator() {
  const [currentXp, setCurrentXp] = useState('0');
  const [currentLevel, setCurrentLevel] = useState(String(levelAt(0)));
  const [targetLevel, setTargetLevel] = useState('1');
  const [bankedArrowShafts, setBankedArrowShafts] = useState('0');
  const [featherPrice, setFeatherPrice] = useState('3.5099');
  const [broadArrowheadPrice, setBroadArrowheadPrice] = useState('55');
  const [result, setResult] = useState<FletchingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const response = await fetch('/api/calculators/fletching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_xp: Number(currentXp),
        target_level: Number(targetLevel),
        banked_arrow_shafts: Number(bankedArrowShafts),
        feather_price: Number(featherPrice),
        broad_arrowhead_price: Number(broadArrowheadPrice),
      }),
    });

    if (!response.ok) {
      setError(`Request failed (${response.status})`);
      return;
    }

    setResult(await response.json());
  }

  // Same level <-> XP convenience as Herblore -- see that component for the
  // asymmetry explanation (level -> XP is only ever a threshold estimate).
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
      <h1>Fletching Calculator</h1>
      <p className="calculator-subtitle">Maple logs only</p>

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

        <label>
          Banked arrow shafts
          <input
            type="number"
            data-testid="banked-arrow-shafts-input"
            value={bankedArrowShafts}
            min={0}
            onChange={(event) => setBankedArrowShafts(stripLeadingZeros(event.target.value))}
          />
        </label>

        <fieldset>
          <legend>Prices (optional)</legend>
          <label>
            Feather price
            <input
              type="number"
              data-testid="feather-price-input"
              value={featherPrice}
              min={0}
              step="any"
              onChange={(event) => setFeatherPrice(stripLeadingZeros(event.target.value))}
            />
          </label>
          <label>
            Broad arrowhead price
            <input
              type="number"
              data-testid="broad-arrowhead-price-input"
              value={broadArrowheadPrice}
              min={0}
              step="any"
              onChange={(event) => setBroadArrowheadPrice(stripLeadingZeros(event.target.value))}
            />
          </label>
        </fieldset>

        <button type="submit" data-testid="submit-button">
          Calculate
        </button>
      </form>

      {error && (
        <p data-testid="error-message" className="error-message">
          {error}
        </p>
      )}

      {result && (
        <div data-testid="result" className="result">
          <div className="stats">
            <div className="stat">
              <span className="stat-label">XP needed</span>
              <span className="stat-value" data-testid="xp-needed">
                {formatNumber(result.xp_needed)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Maple logs needed</span>
              <span className="stat-value" data-testid="logs-needed">
                {formatNumber(result.logs_needed)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Shafts used from bank</span>
              <span className="stat-value" data-testid="shafts-used-from-banked">
                {formatNumber(result.shafts_used_from_banked)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Shafts remaining in bank</span>
              <span className="stat-value" data-testid="shafts-remaining-banked">
                {formatNumber(result.shafts_remaining_banked)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Feathers needed</span>
              <span className="stat-value" data-testid="feathers-needed">
                {formatNumber(result.feathers_needed)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Broad arrowheads needed</span>
              <span className="stat-value" data-testid="broad-arrowheads-needed">
                {formatNumber(result.broad_arrowheads_needed)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Feather cost</span>
              <span className="stat-value" data-testid="feather-cost">
                {formatNumber(result.feather_cost)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Broad arrowhead cost</span>
              <span className="stat-value" data-testid="broad-arrowhead-cost">
                {formatNumber(result.broad_arrowhead_cost)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Total cost</span>
              <span className="stat-value" data-testid="total-cost">
                {formatNumber(result.total_cost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

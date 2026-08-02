import { Fragment, useState, type SubmitEvent } from 'react';
import { levelAt, xpAt } from '../../core/xpTable';
import { formatNumber, stripLeadingZeros } from '../../lib/inputFormatting';
import {
  ITEM_NAMES,
  type AdamantRuneRow,
  type GiantsFoundryResponse,
  type ItemQuantities,
  type MithrilAdamantRow,
} from './types';

type ItemQuantityInputs = Record<keyof ItemQuantities, string>;

const ZERO_ITEMS = ITEM_NAMES.reduce(
  (acc, item) => ({ ...acc, [item]: '0' }),
  {} as ItemQuantityInputs,
);

type Metal = 'mithril' | 'adamant' | 'rune';

function toItemQuantities(inputs: ItemQuantityInputs): ItemQuantities {
  return ITEM_NAMES.reduce(
    (acc, item) => ({ ...acc, [item]: Number(inputs[item]) }),
    {} as ItemQuantities,
  );
}

export function GiantsFoundryCalculator() {
  const [currentXp, setCurrentXp] = useState('0');
  const [currentLevel, setCurrentLevel] = useState(String(levelAt(0)));
  const [targetLevel, setTargetLevel] = useState('1');
  const [mithrilItems, setMithrilItems] = useState<ItemQuantityInputs>(ZERO_ITEMS);
  const [adamantItems, setAdamantItems] = useState<ItemQuantityInputs>(ZERO_ITEMS);
  const [runeItems, setRuneItems] = useState<ItemQuantityInputs>(ZERO_ITEMS);
  const [mithrilAdamantAvgXp, setMithrilAdamantAvgXp] = useState('15561');
  const [adamantMithrilAvgXp, setAdamantMithrilAvgXp] = useState('16065');
  const [adamantRuneAvgXp, setAdamantRuneAvgXp] = useState('21477');
  const [result, setResult] = useState<GiantsFoundryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemsByMetal: Record<Metal, ItemQuantityInputs> = {
    mithril: mithrilItems,
    adamant: adamantItems,
    rune: runeItems,
  };
  const setItemsByMetal: Record<Metal, (value: ItemQuantityInputs) => void> = {
    mithril: setMithrilItems,
    adamant: setAdamantItems,
    rune: setRuneItems,
  };

  function handleItemChange(metal: Metal, item: keyof ItemQuantities, value: string) {
    const stripped = stripLeadingZeros(value);
    setItemsByMetal[metal]({ ...itemsByMetal[metal], [item]: stripped });
  }

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

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const response = await fetch('/api/calculators/giants-foundry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_xp: Number(currentXp),
        target_level: Number(targetLevel),
        mithril_items: toItemQuantities(mithrilItems),
        adamant_items: toItemQuantities(adamantItems),
        rune_items: toItemQuantities(runeItems),
        mithril_adamant_avg_xp: Number(mithrilAdamantAvgXp),
        adamant_mithril_avg_xp: Number(adamantMithrilAvgXp),
        adamant_rune_avg_xp: Number(adamantRuneAvgXp),
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
      <h1>Giants&apos; Foundry Calculator</h1>
      <p className="calculator-subtitle">Mithril, Adamant and Rune only</p>

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
          <legend>Banked items (bar-equivalent)</legend>
          <div className="item-grid" data-testid="item-grid">
            <span />
            <span className="item-grid-header">Mithril</span>
            <span className="item-grid-header">Adamant</span>
            <span className="item-grid-header">Rune</span>
            {ITEM_NAMES.map((item) => (
              <Fragment key={item}>
                <span className="item-grid-label">{item.replace('_', ' ')}</span>
                {(['mithril', 'adamant', 'rune'] as const).map((metal) => (
                  <input
                    key={`${metal}-${item}`}
                    type="number"
                    data-testid={`item-input-${metal}-${item}`}
                    value={itemsByMetal[metal][item]}
                    min={0}
                    onChange={(event) => handleItemChange(metal, item, event.target.value)}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Average XP per sword (optional)</legend>
          <label>
            18 Mithril + 10 Adamant
            <input
              type="number"
              data-testid="mithril-adamant-avg-xp-input"
              value={mithrilAdamantAvgXp}
              min={0}
              step="any"
              onChange={(event) =>
                setMithrilAdamantAvgXp(stripLeadingZeros(event.target.value))
              }
            />
          </label>
          <label>
            18 Adamant + 10 Mithril
            <input
              type="number"
              data-testid="adamant-mithril-avg-xp-input"
              value={adamantMithrilAvgXp}
              min={0}
              step="any"
              onChange={(event) =>
                setAdamantMithrilAvgXp(stripLeadingZeros(event.target.value))
              }
            />
          </label>
          <label>
            18 Adamant + 10 Rune
            <input
              type="number"
              data-testid="adamant-rune-avg-xp-input"
              value={adamantRuneAvgXp}
              min={0}
              step="any"
              onChange={(event) => setAdamantRuneAvgXp(stripLeadingZeros(event.target.value))}
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
          <MithrilAdamantLadderTable
            title="18 Mithril + 10 Adamant"
            testId="mithril-heavy-ladder"
            rows={result.mithril_heavy_ladder}
          />
          <MithrilAdamantLadderTable
            title="18 Adamant + 10 Mithril"
            testId="adamant-heavy-ladder"
            rows={result.adamant_heavy_ladder}
          />
          <AdamantRuneLadderTable
            title="18 Adamant + 10 Rune"
            testId="adamant-rune-ladder"
            rows={result.adamant_rune_ladder}
          />
        </div>
      )}
    </div>
  );
}

function MithrilAdamantLadderTable({
  title,
  testId,
  rows,
}: {
  title: string;
  testId: string;
  rows: MithrilAdamantRow[];
}) {
  return (
    <table data-testid={testId}>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Level</th>
          <th>XP needed</th>
          <th>Swords</th>
          <th>Mithril needed</th>
          <th>Mithril left</th>
          <th>Adamant needed</th>
          <th>Adamant left</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.level}>
            <td>{row.level}</td>
            <td>{formatNumber(row.xp_needed)}</td>
            <td>{formatNumber(row.swords_needed)}</td>
            <td>{formatNumber(row.mithril_bars_needed)}</td>
            <td className={row.mithril_bars_remaining < 0 ? 'negative' : undefined}>
              {formatNumber(row.mithril_bars_remaining)}
            </td>
            <td>{formatNumber(row.adamant_bars_needed)}</td>
            <td className={row.adamant_bars_remaining < 0 ? 'negative' : undefined}>
              {formatNumber(row.adamant_bars_remaining)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdamantRuneLadderTable({
  title,
  testId,
  rows,
}: {
  title: string;
  testId: string;
  rows: AdamantRuneRow[];
}) {
  return (
    <table data-testid={testId}>
      <caption>{title}</caption>
      <thead>
        <tr>
          <th>Level</th>
          <th>XP needed</th>
          <th>Swords</th>
          <th>Adamant needed</th>
          <th>Adamant left</th>
          <th>Rune needed</th>
          <th>Rune left</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.level}>
            <td>{row.level}</td>
            <td>{formatNumber(row.xp_needed)}</td>
            <td>{formatNumber(row.swords_needed)}</td>
            <td>{formatNumber(row.adamant_bars_needed)}</td>
            <td className={row.adamant_bars_remaining < 0 ? 'negative' : undefined}>
              {formatNumber(row.adamant_bars_remaining)}
            </td>
            <td>{formatNumber(row.rune_bars_needed)}</td>
            <td className={row.rune_bars_remaining < 0 ? 'negative' : undefined}>
              {formatNumber(row.rune_bars_remaining)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

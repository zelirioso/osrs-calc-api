import { useState } from 'react';
import { HerbloreCalculator } from './components/Herblore/HerbloreCalculator';
import { FletchingCalculator } from './components/Fletching/FletchingCalculator';
import './App.css';

const CALCULATORS = {
  herblore: { label: 'Herblore', Component: HerbloreCalculator },
  fletching: { label: 'Fletching', Component: FletchingCalculator },
} as const;

type CalculatorKey = keyof typeof CALCULATORS;

function App() {
  const [active, setActive] = useState<CalculatorKey>('herblore');
  const { Component } = CALCULATORS[active];

  return (
    <>
      <nav className="calculator-nav">
        {(Object.entries(CALCULATORS) as [CalculatorKey, (typeof CALCULATORS)[CalculatorKey]][]).map(
          ([key, { label }]) => (
            <button
              key={key}
              type="button"
              data-testid={`nav-${key}`}
              className={key === active ? 'active' : undefined}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ),
        )}
      </nav>
      <Component />
    </>
  );
}

export default App;

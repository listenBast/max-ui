import { Search } from 'lucide-react';
import './styles.css';

export function App() {
  return (
    <main className="bg-[var(--color-canvas)] text-[var(--color-text)]">
      <button><Search /></button>
      <div onClick={() => {}}>Open search</div>
    </main>
  );
}

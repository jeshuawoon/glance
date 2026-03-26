import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        Counter Component
      </h1>
      <p style={{ fontSize: '6rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
        {count}
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
        <button
          onClick={() => setCount(c => c - 1)}
          style={{
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Counter;

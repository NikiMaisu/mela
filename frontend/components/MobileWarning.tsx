'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

const MobileWarning = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) setShow(true);
  }, []);

  const dismiss = () => setShow(false);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(37,36,34,0.45)',
        padding: 24,
      }}
      onClick={dismiss}
    >
      <div
        style={{
          backgroundColor: '#ede0d4',
          border: '4px solid #252422',
          borderRadius: '2px 4px 3px 4px / 4px 2px 4px 3px',
          boxShadow: '8px 8px 0 0 #252422',
          filter: 'url(#hand-drawn)',
          color: '#252422',
          padding: '28px 26px',
          maxWidth: 340,
          textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 12px' }}>heads up</p>
        <p style={{ fontSize: '1.15rem', margin: '0 0 20px', lineHeight: 1.35 }}>
          mela is optimized for desktop use, i recommend switching to a larger device for the best experience
        </p>
        <button
          style={{
            backgroundColor: '#ede0d4',
            border: '3px solid #252422',
            borderRadius: '2px 3px 2px 3px / 3px 2px 3px 2px',
            boxShadow: '4px 4px 0 0 #252422',
            padding: '10px 20px',
            fontSize: '1.1rem',
            fontFamily: 'inherit',
            color: '#252422',
            cursor: 'pointer',
          }}
          onClick={dismiss}
        >
          got it
        </button>
      </div>
    </div>
  );
};

export default MobileWarning;

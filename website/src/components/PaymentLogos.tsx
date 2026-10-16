import React, { useState } from 'react';

/**
 * Logos Officiels Authentiques FCT Automobile
 * Opérateurs de télécoms & paiement camerounais (Orange Money, Orange, MTN MoMo, MTN)
 */

export interface OperatorLogoProps {
  size?: number;
  className?: string;
  rounded?: boolean;
}

export const OrangeMoneyLogo: React.FC<OperatorLogoProps> = ({
  size = 24,
  className = '',
  rounded = true,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ borderRadius: rounded ? '50%' : 4, flexShrink: 0 }}
        aria-label="Orange Money"
      >
        <circle cx="16" cy="16" r="16" fill="#18181b" />
        <path d="M10 20L18 12M18 12H12M18 12V18" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 12L14 20M14 20H20M14 20V14" stroke="#FF7900" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 6,
        backgroundColor: '#18181b',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      }}
      aria-label="Orange Money"
    >
      <img
        src="/images/operators/orange-money.png"
        alt="Orange Money"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: rounded ? '50%' : 6,
          display: 'block',
        }}
      />
    </span>
  );
};

export const MtnMomoLogo: React.FC<OperatorLogoProps> = ({
  size = 24,
  className = '',
  rounded = true,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ borderRadius: rounded ? '50%' : 4, flexShrink: 0 }}
        aria-label="MTN Mobile Money"
      >
        <circle cx="16" cy="16" r="16" fill="#002B49" />
        <ellipse cx="16" cy="16" rx="9" ry="6" stroke="#FFCC00" strokeWidth="2.2" fill="none" />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 6,
        backgroundColor: '#002B49',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      }}
      aria-label="MTN Mobile Money"
    >
      <img
        src="/images/operators/mtn-momo.jpg"
        alt="MTN MoMo"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: rounded ? '50%' : 6,
          display: 'block',
        }}
      />
    </span>
  );
};

export const OrangeLogo: React.FC<OperatorLogoProps> = ({
  size = 24,
  className = '',
  rounded = true,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? '50%' : 4,
          backgroundColor: '#FF7900',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 900,
          fontSize: size * 0.45,
          flexShrink: 0,
        }}
        aria-label="Orange"
      >
        O
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 6,
        backgroundColor: '#FF7900',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
      }}
      aria-label="Orange"
    >
      <img
        src="/images/operators/orange.jpg"
        alt="Orange"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: rounded ? '50%' : 6,
          display: 'block',
        }}
      />
    </span>
  );
};

export const MtnLogo: React.FC<OperatorLogoProps> = ({
  size = 24,
  className = '',
  rounded = true,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? '50%' : 4,
          backgroundColor: '#FFCC00',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#002B49',
          fontWeight: 900,
          fontSize: size * 0.4,
          flexShrink: 0,
        }}
        aria-label="MTN"
      >
        MTN
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '50%' : 6,
        backgroundColor: '#FFCC00',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
      }}
      aria-label="MTN"
    >
      <img
        src="/images/operators/mtn.png"
        alt="MTN"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: rounded ? '50%' : 6,
          display: 'block',
        }}
      />
    </span>
  );
};

export const CashDeskLogo: React.FC<OperatorLogoProps> = ({
  size = 24,
  className = '',
  rounded = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: rounded ? '50%' : 4, flexShrink: 0 }}
    aria-label="Guichet Caisse Agence FCT"
  >
    <circle cx="16" cy="16" r="16" fill="#059669" />
    <path
      d="M8 11.5C8 10.1193 9.11929 9 10.5 9H21.5C22.8807 9 24 10.1193 24 11.5V20.5C24 21.8807 22.8807 23 21.5 23H10.5C9.11929 23 8 21.8807 8 20.5V11.5Z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="3.2" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M11 12.5H11.01M21 19.5H21.01" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);


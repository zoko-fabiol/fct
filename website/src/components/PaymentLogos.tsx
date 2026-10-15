import React from 'react';

/**
 * Logos Vectoriels Professionnels Officiels FCT Automobile
 * Opérateurs de paiement camerounais & Caisse Centrale Douala
 */

export const OrangeMoneyLogo: React.FC<{ size?: number; className?: string; rounded?: boolean }> = ({
  size = 22,
  className,
  rounded = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: rounded ? (size > 22 ? 6 : 4) : 0, flexShrink: 0 }}
    aria-label="Orange Money"
  >
    <rect width="32" height="32" rx={rounded ? 6 : 0} fill="#FF7900" />
    <path
      d="M6 16C6 10.4772 10.4772 6 16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16Z"
      stroke="#FFFFFF"
      strokeWidth="2.4"
    />
    <circle cx="16" cy="16" r="4.2" fill="#FFFFFF" />
  </svg>
);

export const MtnMomoLogo: React.FC<{ size?: number; className?: string; rounded?: boolean }> = ({
  size = 22,
  className,
  rounded = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: rounded ? (size > 22 ? 6 : 4) : 0, flexShrink: 0 }}
    aria-label="MTN Mobile Money"
  >
    <rect width="32" height="32" rx={rounded ? 6 : 0} fill="#FFCC00" />
    <ellipse cx="16" cy="16" rx="10.5" ry="7" stroke="#002B49" strokeWidth="2.2" fill="#FFCC00" />
    <text
      x="16"
      y="18.8"
      textAnchor="middle"
      fill="#002B49"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      letterSpacing="-0.6px"
    >
      MTN
    </text>
  </svg>
);

export const CashDeskLogo: React.FC<{ size?: number; className?: string; rounded?: boolean }> = ({
  size = 22,
  className,
  rounded = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: rounded ? (size > 22 ? 6 : 4) : 0, flexShrink: 0 }}
    aria-label="Guichet Caisse Agence FCT"
  >
    <rect width="32" height="32" rx={rounded ? 6 : 0} fill="#059669" />
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

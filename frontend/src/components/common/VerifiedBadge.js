import React from 'react';
import { ShieldCheck, BadgeCheck, Star } from 'lucide-react';

/**
 * VerifiedBadge Component
 * Displays a professional trust badge based on user role and verification status.
 */
const VerifiedBadge = ({ role, isVerified, trustLevel, className = "", showLabel = true }) => {
  if (!isVerified) return null;

  let icon = <ShieldCheck size={14} />;
  let label = "Verified";
  let colorClass = "verified-default";

  switch (role) {
    case 'farmer':
      icon = <BadgeCheck size={14} />;
      label = "Verified Farmer";
      colorClass = "verified-farmer";
      break;
    case 'transporter':
      label = "Verified Transporter";
      colorClass = "verified-transporter";
      break;
    case 'buyer':
      label = "Business Buyer";
      colorClass = "verified-buyer";
      break;
    default:
      break;
  }

  // Enhance label with trust level if provided
  if (trustLevel && trustLevel !== 'new') {
    const levelLabel = trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1);
    label = `${levelLabel} ${label}`;
    if (trustLevel === 'gold' || trustLevel === 'platinum') {
      icon = <Star size={14} className="animate-pulse" />;
    }
  }

  return (
    <div className={`verified-badge-container ${colorClass} ${className}`} title={label}>
      <span className="verified-icon">{icon}</span>
      {showLabel && <span className="verified-label">{label}</span>}
    </div>
  );
};

export default VerifiedBadge;

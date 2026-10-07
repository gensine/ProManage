import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bgColor }) => {
  return (
    <div className="glass-panel stat-card animate-fade-in">
      <div className="stat-icon" style={{ background: bgColor, color: color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

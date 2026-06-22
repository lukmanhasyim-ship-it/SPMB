import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 ${hover ? 'shadow-md hover:shadow-lg transition-shadow' : 'shadow-sm'} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;

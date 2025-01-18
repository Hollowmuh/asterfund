import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const BADGE_STYLES = {
  BRONZE: {
    background: 'from-orange-700 to-orange-900',
    icon: 'text-orange-400'
  },
  SILVER: {
    background: 'from-gray-400 to-gray-600',
    icon: 'text-gray-200'
  },
  GOLD: {
    background: 'from-yellow-400 to-yellow-600',
    icon: 'text-yellow-300'
  },
  DIAMOND: {
    background: 'from-blue-400 to-blue-600',
    icon: 'text-blue-200'
  },
  PLATINUM: {
    background: 'from-purple-400 to-purple-600',
    icon: 'text-purple-200'
  }
};

export function BadgeDisplay({ level }: { level: string }) {
  const style = BADGE_STYLES[level as keyof typeof BADGE_STYLES];
  
  return (
    <Badge 
      className={`bg-gradient-to-r ${style.background} animate-gradient flex items-center gap-2`}
    >
      <Shield className={`h-4 w-4 ${style.icon}`} />
      {level.charAt(0) + level.slice(1).toLowerCase()} Investor
    </Badge>
  );
}
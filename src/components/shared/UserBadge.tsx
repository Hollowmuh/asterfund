import { Badge } from '@/components/ui/badge';

interface UserBadgeProps {
  level: number;
  totalInvested: number;
}

export function UserBadge({ level, totalInvested }: UserBadgeProps) {
  const getBadgeLevel = () => {
    if (totalInvested >= 100000) return { name: 'Diamond', color: 'from-purple-400 to-pink-500' };
    if (totalInvested >= 50000) return { name: 'Gold', color: 'from-yellow-400 to-orange-500' };
    if (totalInvested >= 10000) return { name: 'Silver', color: 'from-gray-400 to-gray-500' };
    return { name: 'Bronze', color: 'from-orange-400 to-red-500' };
  };

  const badge = getBadgeLevel();

  return (
    <Badge className={`bg-gradient-to-r ${badge.color}`}>
      {badge.name} Investor
    </Badge>
  );
}
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentCategoryProps {
  category: string;
  currentValue: number;
  change: number;
}

export function InvestmentCategory({ category, currentValue, change }: InvestmentCategoryProps) {
  return (
    <Card className="bg-gray-800/50 border-none">
      <CardHeader>
        <CardTitle className="text-sm capitalize flex items-center justify-between">
          {category}
          {change !== 0 && (
            change >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-400" /> :
              <TrendingDown className="h-4 w-4 text-red-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Current</span>
            <span>${currentValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Change</span>
            <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
              {change}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
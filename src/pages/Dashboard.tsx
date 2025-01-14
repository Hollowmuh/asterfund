import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletConnect } from '@/components/shared/WalletConnect';
import { useWalletStore } from '@/store/useWalletStore';

interface Investment {
  amount: number;
  currentValue: number;
  change: number;
}

interface InvestmentCategory {
  category: string;
  currentValue: number;
  change: number;
}

function InvestmentCategory({ category, currentValue, change }: InvestmentCategory) {
  return (
    <Card className="bg-gray-800/50 border-none transform transition-all duration-200 hover:scale-102 hover:bg-gray-800/70">
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
            <span className="font-medium">${currentValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Change</span>
            <span className={`font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestmentDashboard() {
  const { account, balance, transactions } = useWalletStore();
  const [investments, setInvestments] = useState(() => ({
    undeployed: { amount: 0, currentValue: 0, change: 0 },
    crypto: { amount: 25000, currentValue: 28000, change: 12 },
    stocks: { amount: 30000, currentValue: 31500, change: 5 },
    realEstate: { amount: 20000, currentValue: 23000, change: 15 }
  }));

  // Calculate historical data including new deposits/withdrawals
  const historicalData = useMemo(() => {
    const baseValue = 75000;
    const months = 6;
    const monthlyData = [];
    let runningTotal = baseValue;

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - 1 - i));
      
      // Find transactions for this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });

      // Calculate month's balance including transactions
      const monthTransactionTotal = monthTransactions.reduce((total, tx) => {
        return total + (tx.type === 'deposit' ? tx.amount : -tx.amount);
      }, 0);

      runningTotal += monthTransactionTotal;

      // Add some market variation
      const variance = (Math.random() - 0.5) * 0.05; // ±2.5% monthly variance
      runningTotal *= (1 + variance);

      monthlyData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        value: Math.round(runningTotal)
      });
    }

    return monthlyData;
  }, [transactions]);

  // Update investments when transactions occur
  useEffect(() => {
    const depositTotal = transactions.reduce((total, tx) => {
      return tx.type === 'deposit' ? total + tx.amount : total;
    }, 0);

    const withdrawalTotal = transactions.reduce((total, tx) => {
      return tx.type === 'withdraw' ? total + tx.amount : total;
    }, 0);

    setInvestments(prev => {
      const undeployedAmount = depositTotal - withdrawalTotal;
      return {
        ...prev,
        undeployed: {
          amount: undeployedAmount,
          currentValue: undeployedAmount,
          change: 0
        }
      };
    });
  }, [transactions]);

  const totalInvested = useMemo(() => 
    Object.values(investments).reduce((sum, { amount }) => sum + amount, 0),
    [investments]
  );

  const currentValue = useMemo(() => 
    Object.values(investments).reduce((sum, { currentValue }) => sum + currentValue, 0),
    [investments]
  );

  const totalChange = useMemo(() => 
    ((currentValue - totalInvested) / totalInvested * 100) || 0,
    [currentValue, totalInvested]
  );

  const navigate = useNavigate();

  if (!account) {
    return <WalletConnect />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="backdrop-blur-sm bg-white/10 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 animate-gradient">
                  Gold Investor
                </Badge>
                <span className="text-sm text-gray-400">Balance: ${balance.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {totalChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                <span className={`${totalChange >= 0 ? "text-green-400" : "text-red-400"} font-medium`}>
                  {totalChange.toFixed(2)}%
                </span>
              </div>
              <Button
                onClick={() => navigate('/manage-funds')}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 transform transition-all duration-200 hover:scale-105"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Manage Funds
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/30">
                <p className="text-gray-400">Total Invested</p>
                <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/30">
                <p className="text-gray-400">Current Value</p>
                <p className="text-2xl font-bold">${currentValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="h-64 bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickFormatter={(value) => `$${(value / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={{ fill: '#60A5FA', r: 4 }}
                    activeDot={{ r: 6, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(investments).map(([category, data]) => (
                <InvestmentCategory
                  key={category}
                  category={category}
                  currentValue={data.currentValue}
                  change={data.change}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
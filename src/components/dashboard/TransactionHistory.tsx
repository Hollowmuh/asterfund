import React from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Transaction History Component
export const TransactionHistory = () => {
  const { transactions, clearFailedTransactions } = useTransactionStore();

  const getCategoryName = (category?: number) => {
    const categoryMap = {
      0: 'Cryptocurrency',
      1: 'Stock Market',
      2: 'Commodities',
      3: 'Government Bonds'
    };
    return category !== undefined ? categoryMap[category as keyof typeof categoryMap] : 'Unknown';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const days = Math.floor(seconds / (24 * 60 * 60));
    return `${days} days`;
  };

  const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)} USDT`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        {transactions.some(tx => tx.status === 'failed') && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFailedTransactions}
          >
            Clear Failed
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {transactions.map(tx => (
          <Card key={tx.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`capitalize font-medium ${
                      tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(tx.timestamp)}
                    </span>
                  </div>
                  
                  {tx.type === 'deposit' && (
                    <div className="text-sm text-gray-600">
                      <div>Category: {getCategoryName(tx.category)}</div>
                      <div>Lock Period: {formatDuration(tx.lockDuration)}</div>
                    </div>
                  )}
                  
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{formatAmount(tx.amount)}</div>
                  <div className={`text-sm ${
                    tx.status === 'completed' ? 'text-green-600' :
                    tx.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {transactions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
};
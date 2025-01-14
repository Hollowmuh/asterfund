import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Transaction {
  type: string;
  amount: number;
  timestamp: string;
  status: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <Card className="bg-gray-800/50 border-none">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2">
              <div>
                <p className="font-medium">{tx.type}</p>
                <p className="text-sm text-gray-400">
                  {new Date(tx.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${tx.amount.toLocaleString()}</p>
                <p className="text-sm text-green-400">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
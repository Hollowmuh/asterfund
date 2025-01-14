import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, WalletIcon, ArrowLeftIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { WalletConnect } from '@/components/shared/WalletConnect';
import { useWalletStore } from '@/store/useWalletStore';

// FundsForm Component
interface FundsFormProps {
  onTransaction: (type: string, amount: number) => void;
}

function FundsForm({ onTransaction }: FundsFormProps) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      onTransaction(activeTab, Number(amount));
      toast({
        title: "Success",
        description: `${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${amount} processed successfully`,
      });
      setAmount('');
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-none">
      <CardHeader>
        <CardTitle>Manage Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'deposit' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab('deposit')}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Deposit
            </Button>
            <Button
              variant={activeTab === 'withdraw' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setActiveTab('withdraw')}
            >
              <MinusIcon className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-8"
                  min="0"
                  step="0.01"
                  disabled={isProcessing}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <WalletIcon className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? 'Processing...' : `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} Funds`}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// Transaction History Component
interface Transaction {
  type: string;
  amount: number;
  timestamp: string;
  status: string;
}

function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <p className="text-center text-gray-400">No transactions yet</p>
      ) : (
        <AnimatePresence>
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.timestamp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <div>
                <p className="font-medium capitalize">{tx.type}</p>
                <p className="text-sm text-gray-400">
                  {new Date(tx.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${tx.amount.toLocaleString()}</p>
                <p className="text-sm text-green-400">{tx.status}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

// Main ManageFunds Component
export default function ManageFunds() {
  const navigate = useNavigate();
  const { account, transactions, addTransaction } = useWalletStore();
  const { toast } = useToast();

  const handleTransaction = (type: string, amount: number) => {
    addTransaction(type, amount);
  };

  if (!account) {
    return <WalletConnect />;    
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <FundsForm onTransaction={handleTransaction} />

        <Card className="backdrop-blur-sm bg-white/10 border-none">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionHistory transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
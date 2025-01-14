import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FundsFormProps {
  onTransaction?: (type: string, amount: number) => void;
  maxWithdrawal?: number;
}


export function FundsForm({ onTransaction, maxWithdrawal = 0 }: FundsFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
    const handleSuccess = (message: string) => {
      toast({
        title: "Success!",
        description: message,
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };

  const validateAmount = useCallback((value: string, type: 'deposit' | 'withdraw'): boolean => {
    const numAmount = parseFloat(value);
    setError(null);

    if (!value || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (type === 'withdraw' && numAmount > maxWithdrawal) {
      setError(`Maximum withdrawal amount is $${maxWithdrawal.toLocaleString()}`);
      return false;
    }

    return true;
  }, [maxWithdrawal]);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!validateAmount(amount, type)) return;
    
    const numAmount = parseFloat(amount);
    
    setLoading(true);
    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onTransaction?.(type, numAmount);
      
      toast({
        title: 'Transaction Successful',
        description: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${numAmount.toLocaleString()} completed.`,
      });
      handleSuccess(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
      setAmount('');
      setError(null);
    } catch (err) {
      toast({
        title: 'Transaction Failed',
        description: 'There was an error processing your transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Manage Your Funds
          {maxWithdrawal > 0 && (
            <span className="text-sm font-normal text-gray-400">
              Available: ${maxWithdrawal.toLocaleString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className={`bg-gray-800/50 border-gray-700 pl-8 ${
              error ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            disabled={loading}
            min="0"
            step="0.01"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => handleTransaction('deposit')}
            disabled={loading || !amount}
            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Deposit'
            )}
          </Button>
          <Button
            onClick={() => handleTransaction('withdraw')}
            disabled={loading || !amount || parseFloat(amount) > maxWithdrawal}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Withdraw'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
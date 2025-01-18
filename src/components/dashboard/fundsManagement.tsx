import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { useTransactionStore } from '@/store/transaction-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const INVESTMENT_CATEGORIES = [
  { value: '0', label: 'Cryptocurrency', description: 'Diversified crypto portfolio' },
  { value: '1', label: 'Stock Market', description: 'Global equity markets' },
  { value: '2', label: 'Commodities', description: 'Natural resources and metals' },
  { value: '3', label: 'Government Bonds', description: 'Sovereign debt instruments' }
];

const LOCK_DURATIONS = [
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
  { value: '90', label: '90 Days' },
  { value: '180', label: '180 Days' },
  { value: '365', label: '365 Days' }
];

const FundManagement = () => {
  const {
    createLockedInvestment,
    withdraw,
    account,
    connectMetaMask,
    refreshBalance,
    approveUSDT,
    getUSDTBalance,
    isConnecting
  } = useWalletStore();
  
  const { addTransaction, updateTransactionStatus } = useTransactionStore();

  // Form states
  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [lockDuration, setLockDuration] = useState('30');
  const [category, setCategory] = useState('0');

  // UI states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deposit');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (account) {
      refreshData();
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const refreshData = async () => {
    try {
      const balance = await getUSDTBalance();
      setUsdtBalance(balance);
      await refreshBalance();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error refreshing data",
        description: err instanceof Error ? err.message : "Failed to refresh data"
      });
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      connectMetaMask();
      return;
    }

    setLoading(true);
    const txId = addTransaction({
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      category: parseInt(category),
      lockDuration: parseInt(lockDuration) * 24 * 60 * 60
    });

    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      setIsApproving(true);
      await approveUSDT(depositAmount);
      setIsApproving(false);

      const durationInSeconds = parseInt(lockDuration) * 24 * 60 * 60;
      const tx = await createLockedInvestment(
        depositAmount,
        durationInSeconds,
        parseInt(category)
      );

      updateTransactionStatus(txId, { status: 'completed', hash: tx.hash });
      setAmount('');
      toast({
        title: "Success",
        description: "Investment created successfully!"
      });
      await refreshData();
    } catch (err) {
      updateTransactionStatus(txId, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Transaction failed'
      });
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Transaction failed"
      });
    } finally {
      setLoading(false);
      setIsApproving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      connectMetaMask();
      return;
    }

    setLoading(true);
    const txId = addTransaction({
      type: 'withdraw',
      amount: parseFloat(withdrawAmount),
      status: 'pending'
    });

    try {
      const tx = await withdraw(parseFloat(withdrawAmount));
      updateTransactionStatus(txId, { status: 'completed', hash: tx.hash });
      setWithdrawAmount('');
      toast({
        title: "Success",
        description: "Withdrawal successful!"
      });
      await refreshData();
    } catch (err) {
      updateTransactionStatus(txId, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Withdrawal failed'
      });
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: err instanceof Error ? err.message : "Withdrawal failed"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Connect your wallet to manage investments</p>
          <Button onClick={connectMetaMask} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      
      
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'deposit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('deposit')}
            className="flex-1"
          >
            Deposit
          </Button>
          <Button
            variant={activeTab === 'withdraw' ? 'default' : 'outline'}
            onClick={() => setActiveTab('withdraw')}
            className="flex-1"
          >
            Withdraw
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          USDT Balance: {parseFloat(usdtBalance).toFixed(2)} USDT
        </div>

        {activeTab === 'deposit' ? (
          <form onSubmit={handleDeposit} className="space-y-4">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
            
            <Select value={lockDuration} onValueChange={setLockDuration}>
              <SelectTrigger>
                <SelectValue>
                  {LOCK_DURATIONS.find(d => d.value === lockDuration)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCK_DURATIONS.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue>
                  {INVESTMENT_CATEGORIES.find(c => c.value === category)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="w-full" disabled={loading || isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving USDT...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Investment...
                </>
              ) : (
                'Create Investment'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw USDT'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default FundManagement;
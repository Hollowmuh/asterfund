import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ethers } from 'ethers';
import { useTransactionStore } from '@/store/transaction-store';

// Investment categories matching the smart contract enum
const INVESTMENT_CATEGORIES = ['CRYPTO', 'STOCKS', 'COMMODITIES', 'BONDS'];

export function FundsForm({ contractAddress }) {
  const [amount, setAmount] = React.useState('');
  const [lockDuration, setLockDuration] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [error, setError] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { toast } = useToast();

  const validateInputs = () => {
    setError(null);

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!lockDuration || isNaN(parseInt(lockDuration)) || parseInt(lockDuration) <= 0) {
      setError('Please enter a valid lock duration in days');
      return false;
    }

    if (!category) {
      setError('Please select an investment category');
      return false;
    }

    return true;
  };

  const handleDeposit = async () => {
    if (!validateInputs()) return;

    if (!window.ethereum) {
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to continue with the deposit.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const contractAddress = import.meta.env.VITE_FUND_MANAGER_CONTRACT_ADDRESS;
      
      // Create contract instance
      const abi = ['function createLockedInvestment(uint256 amount, uint256 lockDuration, uint8 category)'];
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Convert inputs to contract parameters
      const amountWei = ethers.parseEther(amount);
      const lockDurationSeconds = parseInt(lockDuration) * 24 * 60 * 60; // Convert days to seconds
      const categoryIndex = INVESTMENT_CATEGORIES.indexOf(category);

      // Create transaction
      const tx = await contract.createLockedInvestment(
        amountWei,
        lockDurationSeconds,
        categoryIndex,
        { value: amountWei }
      );

      // Wait for transaction to be mined
      await tx.wait();

      toast({
        title: 'Deposit Successful',
        description: `Successfully deposited ${amount} ETH for ${lockDuration} days in ${category} category.`,
      });

      // Reset form
      setAmount('');
      setLockDuration('');
      setCategory('');

    } catch (err) {
      console.error(err);
      toast({
        title: 'Transaction Failed',
        description: err.message || 'There was an error processing your deposit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-none">
      <CardHeader>
        <CardTitle>Create Locked Investment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type="number"
            placeholder="Enter amount in ETH"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            className="bg-gray-800/50 border-gray-700 pl-8"
            disabled={isProcessing}
            min="0"
            step="0.01"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Ξ</span>
        </div>

        <Input
          type="number"
          placeholder="Lock duration (days)"
          value={lockDuration}
          onChange={(e) => {
            setLockDuration(e.target.value);
            setError(null);
          }}
          className="bg-gray-800/50 border-gray-700"
          disabled={isProcessing}
          min="1"
        />

        <Select 
          value={category} 
          onValueChange={setCategory}
          disabled={isProcessing}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700">
            <SelectValue placeholder="Select investment category" />
          </SelectTrigger>
          <SelectContent>
            {INVESTMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleDeposit}
          disabled={isProcessing || !amount || !lockDuration || !category}
          className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Create Locked Investment'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
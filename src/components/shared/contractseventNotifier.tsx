import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useWalletStore } from '@/store/useWalletStore';
import { BadgeLevel } from '@/types';
import { WalletConnect } from './WalletConnect';
import { ethers } from 'ethers';

export function ContractEventNotifier() {
  const { contract, account } = useWalletStore();
  const { toast } = useToast();

  useEffect(() => {
      if (!contract || !account)
          return;

    const handleBadgeChange = (
      investor: string,
      previousLevel: number,
      newLevel: number
    ) => {
      if (investor.toLowerCase() === account.toLowerCase()) {
        toast({
          title: '🎉 Achievement Unlocked!',
          description: `Congratulations! You've reached ${BadgeLevel[newLevel]} status!`,
          duration: 5000,
        });
      }
    };

    const handleNewPeakTVL = (
      timestamp: number,
      amount: ethers.BigNumber
    ) => {
      toast({
        title: '🚀 New Peak TVL!',
        description: `The fund has reached a new peak of $${
          parseFloat(ethers.utils.formatEther(amount)).toLocaleString()
        }!`,
        duration: 3000,
      });
    };

    const handlePerformanceUpdate = (
      timestamp: number,
      totalValue: ethers.BigNumber,
      dailyChange: ethers.BigNumber,
      activeInvestors: number
    ) => {
      const changePercent = parseFloat(ethers.utils.formatEther(dailyChange));
      if (Math.abs(changePercent) >= 5) { // Only notify on significant changes
        toast({
          title: changePercent > 0 ? '📈 Strong Performance' : '📉 Market Alert',
          description: `Fund value has changed by ${changePercent.toFixed(2)}% today`,
          duration: 3000,
          variant: changePercent > 0 ? 'default' : 'destructive',
        });
      }
    };

    // Set up event listeners
    contract.on('BadgeLevelChange', handleBadgeChange);
    contract.on('NewPeakTVL', handleNewPeakTVL);
    contract.on('PerformanceUpdate', handlePerformanceUpdate);

    // Cleanup
    return () => {
      contract.off('BadgeLevelChange', handleBadgeChange);
      contract.off('NewPeakTVL', handleNewPeakTVL);
      contract.off('PerformanceUpdate', handlePerformanceUpdate);
    };
  }, [contract, account, toast]);

  return null; // This is a purely functional component
}

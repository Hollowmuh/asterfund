import { create } from 'zustand';
import { ethers } from 'ethers';
import FUNDMANAGER from '../artifacts/contracts/manager.sol/FundManager.json';

enum BadgeLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
  PLATINUM = 'PLATINUM'
}
interface Transaction {
  type: string;
  amount: number;
  timestamp: string;
  status: string;
  hash?: string;
}

interface InvestorStats {
  totalInvested: number;
  currentTotal: number;
  unrealizedProfit: number;
  realizedProfit: number;
  totalFeePaid: number;
  badgeLevel: BadgeLevel;
  investmentCount: number;
}

interface WalletState {
  account: string | null;
  balance: number;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  contract: ethers.Contract | null;
  transactions: Transaction[];
  isConnecting: boolean;
  error: string | null;
  badgeLevel: BadgeLevel;
  stats: InvestorStats | null;
  setAccount: (account: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setProvider: (provider: ethers.BrowserProvider | null) => void;
  addTransaction: (type: string, amount: number, hash?: string) => void;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  refereshStats: () => Promise<void>;
}

const FUND_MANAGER_ADDRESS = import.meta.env.VITE_FUND_MANAGER_CONTRACT_ADDRESS;
if (!FUND_MANAGER_ADDRESS) {
  throw new Error('Fund manager contract address not found in environment variables');
}

const setupContractListeners = (contract: ethers.Contract, account: string, store: any) => {
  contract.on('BadgeLevelChange', (user: string, previousLevel: BadgeLevel, newLevel: BadgeLevel) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      store.refereshStats();
    }
  });
  
  contract.on('InvestmentPerformance', (user: string, investmentId: number, previousValue: number, newValue: number) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      store.refereshStats();
    }
  });
};

export const useWalletStore = create<WalletState>((set, get) => ({
  account: null,
  balance: 0,
  chainId: null,
  provider: null,
  contract: null,
  transactions: [],
  isConnecting: false,
  error: null,
  badgeLevel: BadgeLevel.BRONZE,
  stats: null,

  setAccount: (account) => set({ account }),
  
  setChainId: (chainId) => set({ chainId }),
  
  setProvider: (provider) => set({ provider }),

  addTransaction: (type, amount, hash) => {
    const transaction: Transaction = {
      type,
      amount,
      timestamp: new Date().toISOString(),
      status: 'Completed',
      hash
    };
    set(state => ({
      transactions: [transaction, ...state.transactions]
    }));
  },

  refereshStats: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;

    try {
      const stats = await contract.getInvestorStats(account);
      set({ 
        stats: {
          totalInvested: parseFloat(ethers.formatEther(stats.totalInvested)),
          currentTotal: parseFloat(ethers.formatEther(stats.currentTotal)),
          unrealizedProfit: parseFloat(ethers.formatEther(stats.unrealizedProfit)),
          realizedProfit: parseFloat(ethers.formatEther(stats.realizedProfit)),
          totalFeePaid: parseFloat(ethers.formatEther(stats.totalFeePaid)),
          badgeLevel: stats.badgeLevel,
          investmentCount: stats.investmentCount.toNumber()
        },
        badgeLevel: stats.badgeLevel
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },

  connectMetaMask: async () => {
    try {
      set({ isConnecting: true, error: null });

      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const account = accounts[0];
      const network = await provider.getNetwork();
      const balanceWei = await provider.getBalance(account);
      const balanceInEther = parseFloat(ethers.formatEther(balanceWei));

      if (!window.ethereum._eventsAttached) {
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            get().disconnect();
          } else {
            set({ account: newAccounts[0] });
          }
        });

        window.ethereum.on('chainChanged', (chainId: string) => {
          set({ chainId: parseInt(chainId, 16) });
        });

        window.ethereum.on('disconnect', () => {
          get().disconnect();
        });

        window.ethereum._eventsAttached = true;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        FUND_MANAGER_ADDRESS,
        FUNDMANAGER.abi,
        signer
      );

      setupContractListeners(contract, account, get());

      set({
        account,
        chainId: Number(network.chainId),
        provider,
        contract,
        balance: balanceInEther,
        isConnecting: false,
      });
      
      await get().refreshBalance();
      await get().refereshStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false,
        account: null,
        provider: null,
        chainId: null
      });
      throw error;
    }
  },

  disconnect: () => {
    const { contract } = get();
    if (contract) {
      contract.removeAllListeners();
    }
    if (window.ethereum && window.ethereum._eventsAttached) {
      window.ethereum.removeAllListeners();
      window.ethereum._eventsAttached = false;
    }

    set({
      account: null,
      balance: 0,
      chainId: null,
      provider: null,
      contract: null,
      error: null
    });
  },

  refreshBalance: async () => {
    const { provider, account } = get();
    if (!provider || !account) return;

    try {
      const balanceWei = await provider.getBalance(account);
      const balance = parseFloat(ethers.formatEther(balanceWei));
      set({ balance });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }
}));
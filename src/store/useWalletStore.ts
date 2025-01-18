import { create } from 'zustand';
import { ethers } from 'ethers';
import FUNDMANAGER from '../artifacts/contracts/manager.sol/FundManager.json';
import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

enum BadgeLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
  PLATINUM = 'PLATINUM'
}
interface ContractTransaction {
  hash: string;
  wait: () => Promise<ContractTransactionReceipt>;
}

interface ContractTransactionReceipt {
  status: number;
  hash: string;
}
interface Transaction {
  id: string;
  type: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
}

interface InvestorStats {
  totalInvested: number;
  totalWithdrawn: number;
  highWaterMark: number;
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
  usdtContract: ethers.Contract | null;
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
  refreshStats: () => Promise<void>;
  createLockedInvestment: (amount: number, lockDuration: number, category: number) => Promise<ContractTransaction>;
  withdraw: (amount: number) => Promise<ContractTransaction>;
  getUSDTBalance: () => Promise<string>;
  approveUSDT: (amount: number) => Promise<void>;
}

const FUND_MANAGER_ADDRESS = import.meta.env.VITE_FUND_MANAGER_CONTRACT_ADDRESS;
const USDT_CONTRACT_ADDRESS = import.meta.env.VITE_USDT_CONTRACT_ADDRESS; //
const USDT_DECIMALS = 18;

if (!FUND_MANAGER_ADDRESS) {
  throw new Error('Fund manager contract address not found in environment variables');
}

const formatUSDT = (amount: ethers.BigNumberish): string => {
  return (Number(amount) / Math.pow(10, USDT_DECIMALS)).toString();
};

const parseUSDT = (amount: number): ethers.BigNumberish => {
  return ethers.parseUnits(amount.toString(), USDT_DECIMALS);
};

const setupContractListeners = (contract: ethers.Contract, account: string, store: any) => {
  contract.on('BadgeLevelChange', (user: string, previousLevel: BadgeLevel, newLevel: BadgeLevel) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      store.refreshStats();
    }
  });

  contract.on('WithdrawalEvent', async (user: string, amount: ethers.BigNumberish, profit: ethers.BigNumberish) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      const amountFormatted = parseFloat(formatUSDT(amount));
      store.addTransaction('withdraw', amountFormatted);
      store.refreshStats();
    }
  });

  contract.on('InvestmentPerformance', (user: string, investmentId: number, previousValue: number, newValue: number) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      store.refreshStats();
    }
  });
};

export const useWalletStore = create<WalletState>((set, get) => ({
  account: null,
  balance: 0,
  chainId: null,
  provider: null,
  contract: null,
  usdtContract: null,
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
      id: Date.now().toString(),
      type,
      amount,
      timestamp: new Date().toISOString(),
      status: 'completed',
      hash
    };
    set(state => ({
      transactions: [transaction, ...state.transactions]
    }));
  },

  getUSDTBalance: async () => {
    const { usdtContract, account } = get();
    if (!usdtContract || !account) return '0';

    try {
      const balance = await usdtContract.balanceOf(account);
      return formatUSDT(balance);
    } catch (error) {
      console.error('Failed to get USDT balance:', error);
      return '0';
    }
  },

  approveUSDT: async (amount: number) => {
    const { usdtContract, contract } = get();
    if (!usdtContract || !contract) throw new Error('Contracts not initialized');

    const parsedAmount = parseUSDT(amount);
    const tx = await usdtContract.approve(FUND_MANAGER_ADDRESS, parsedAmount);
    await tx.wait();
  },

  refreshStats: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;

    try {
      const stats = await contract.getInvestorStats(account);
      set({ 
        stats: {
          totalInvested: parseFloat(formatUSDT(stats.totalInvested)),
          totalWithdrawn: parseFloat(formatUSDT(stats.totalWithdrawn)),
          highWaterMark: parseFloat(formatUSDT(stats.highWaterMark)),
          realizedProfit: parseFloat(formatUSDT(stats.realizedProfit)),
          totalFeePaid: parseFloat(formatUSDT(stats.totalFeePaid)),
          badgeLevel: stats.badgeLevel,
          investmentCount: stats.investments.toNumber()
        },
        badgeLevel: stats.badgeLevel
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  },

  createLockedInvestment: async (amount: number, lockDuration: number, category: number) => {
    const { contract } = get();
    if (!contract) throw new Error('No contract instance');

    const parsedAmount = parseUSDT(amount);
    const tx = await contract.createLockedInvestment(parsedAmount, lockDuration, category);
    await tx.wait();
    
    get().addTransaction('deposit', amount, tx.hash);
    get().refreshStats();
    get().refreshBalance();
    return tx;
  },

  withdraw: async (amount: number) => {
    const { contract } = get();
    if (!contract) throw new Error('No contract instance');

    const parsedAmount = parseUSDT(amount);
    const tx = await contract.withdraw(parsedAmount);
    await tx.wait();
    
    get().addTransaction('withdraw', amount, tx.hash);
    get().refreshStats();
    get().refreshBalance();
    return tx;
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
      const signer = await provider.getSigner();

      // Initialize contracts
      const fundManagerContract = new ethers.Contract(
        FUND_MANAGER_ADDRESS,
        FUNDMANAGER.abi,
        signer
      );

      const usdtContract = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        IERC20.abi,
        signer
      );

      setupContractListeners(fundManagerContract, account, get());

      // Setup MetaMask event listeners
      if (!window.ethereum._eventsAttached) {
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
            get().disconnect();
          } else {
            set({ account: newAccounts[0] });
            get().refreshStats();
            get().refreshBalance();
          }
        });

        window.ethereum.on('chainChanged', (chainId: string) => {
          set({ chainId: parseInt(chainId, 16) });
          get().refreshStats();
          get().refreshBalance();
        });

        window.ethereum.on('disconnect', () => {
          get().disconnect();
        });

        window.ethereum._eventsAttached = true;
      }

      set({
        account,
        chainId: Number(network.chainId),
        provider,
        contract: fundManagerContract,
        usdtContract,
        isConnecting: false,
      });
      
      await get().refreshBalance();
      await get().refreshStats();
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
      usdtContract: null,
      error: null,
      stats: null,
      badgeLevel: BadgeLevel.BRONZE,
      transactions: []
    });
  }
}));
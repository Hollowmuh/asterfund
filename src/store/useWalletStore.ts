import { create } from 'zustand';
import { ethers } from 'ethers';

interface WalletState {
  account: string | null;
  balance: number;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  transactions: Array<{
    type: string;
    amount: number;
    timestamp: string;
    status: string;
  }>;
  isConnecting: boolean;
  error: string | null;
  setAccount: (account: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setProvider: (provider: ethers.BrowserProvider | null) => void;
  addTransaction: (type: string, amount: number) => void;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  account: null,
  balance: 0,
  chainId: null,
  provider: null,
  transactions: [],
  isConnecting: false,
  error: null,

  setAccount: (account) => set({ account }),
  setChainId: (chainId) => set({ chainId }),
  setProvider: (provider) => set({ provider }),

  addTransaction: (type, amount) =>
    set((state) => ({
      balance: type === 'deposit' ? state.balance + amount : state.balance - amount,
      transactions: [
        {
          type,
          amount,
          timestamp: new Date().toISOString(),
          status: 'Completed'
        },
        ...state.transactions
      ]
    })),

  connectMetaMask: async () => {
    try {
      set({ isConnecting: true, error: null });

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const account = accounts[0];

      // Get network
      const network = await provider.getNetwork();
      
      // Get balance
      const balanceWei = await provider.getBalance(account);
      const balanceInEther = parseFloat(ethers.formatEther(balanceWei));

      // Set up event listeners
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

      set({
        account,
        chainId: Number(network.chainId),
        provider,
        balance: balanceInEther,
        isConnecting: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false,
        account: null,
        provider: null,
        chainId: null
      });
      throw error; // Re-throw to handle in the component
    }
  },

  disconnect: () => {
    // Remove event listeners if they exist
    if (window.ethereum && window.ethereum._eventsAttached) {
      window.ethereum.removeAllListeners();
      window.ethereum._eventsAttached = false;
    }

    set({
      account: null,
      balance: 0,
      chainId: null,
      provider: null,
      error: null
    });
  }
}));
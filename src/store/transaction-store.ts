import {create} from 'zustand'
interface TransactionStatus {
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
  error?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  timestamp: string;
  status: TransactionStatus['status'];
  hash?: string;
  error?: string;
  category?: number;
  lockDuration?: number;
}

interface TransactionState {
  transactions: Transaction[];
  isProcessing: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => string;
  setProcessing: (isProcessing: boolean) => void;
  getTransactionsByStatus: (status: TransactionStatus['status']) => Transaction[];
  clearFailedTransactions: () => void;
  updateTransactionStatus: (id: string, statusUpdate: Partial<TransactionStatus>) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isProcessing: false,
  
  addTransaction: (transactionData) => {
    const id = Math.random().toString(36).substr(2, 9);
    const transaction: Transaction = {
      ...transactionData,
      id,
      timestamp: new Date().toISOString(),
    };
    
    set(state => ({
      transactions: [transaction, ...state.transactions]
    }));
    
    return id;
  },
  
  setProcessing: (isProcessing) => {
    set({ isProcessing });
  },
  
  getTransactionsByStatus: (status) => {
    const { transactions } = get();
    return transactions.filter(tx => tx.status === status);
  },
  
  clearFailedTransactions: () => {
    set(state => ({
      transactions: state.transactions.filter(tx => tx.status !== 'failed')
    }));
  },
  
  updateTransactionStatus: (id, statusUpdate) => {
    set(state => ({
      transactions: state.transactions.map(tx =>
        tx.id === id
          ? { ...tx, ...statusUpdate }
          : tx
      )
    }));
  }
}));
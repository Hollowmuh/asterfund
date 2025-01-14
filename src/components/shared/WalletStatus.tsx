import { useWalletStore } from '@/store/useWalletStore';

export function WalletStatus() {
  const account = useWalletStore((state) => state.account);
  
  if (!account) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
      <p className="text-sm text-gray-400">Connected Wallet</p>
      <p className="font-mono">{account}</p>
    </div>
  );
}
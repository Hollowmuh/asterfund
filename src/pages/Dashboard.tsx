import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useWalletStore } from '@/store/useWalletStore';
import FUNDMANAGER from '../artifacts/contracts/manager.sol/FundManager.json'

// Investment category card component
function InvestmentCategory({ category, currentValue, change }) {
  return (
    <Card className="bg-gray-800/50 border-none transform transition-all duration-200 hover:scale-105 hover:bg-gray-800/70">
      <CardHeader>
        <CardTitle className="text-sm capitalize flex items-center justify-between">
          {category}
          {change !== 0 && (
            change >= 0 ?
              <TrendingUp className="h-4 w-4 text-green-400" /> :
              <TrendingDown className="h-4 w-4 text-red-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Current</span>
            <span className="font-medium">${currentValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Change</span>
            <span className={`font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvestmentDashboard({}) {
  const { account } = useWalletStore();
  const contractABI = FUNDMANAGER.abi;
  const contractAddress = import.meta.env.VITE_FUND_MANAGER_CONTRACT_ADDRESS;
  const [loading, setLoading] = useState(true);
  const [investorStats, setInvestorStats] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [categoryData, setCategoryData] = useState({
    CRYPTO: { currentValue: 0, change: 0 },
    STOCKS: { currentValue: 0, change: 0 },
    COMMODITIES: { currentValue: 0, change: 0 },
    BONDS: { currentValue: 0, change: 0 }
  });

  useEffect(() => {
    const loadContractData = async () => {
      if (!account) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        // Get investor stats
        const stats = await contract.getInvestorStats(account);
        setInvestorStats({
          totalInvested: ethers.formatUnits(stats.totalInvested, 18),
          currentTotal: ethers.formatUnits(stats.currentTotal, 18),
          unrealizedProfit: ethers.formatUnits(stats.unrealizedProfit, 18),
          realizedProfit: ethers.formatUnits(stats.realizedProfit, 18),
          badgeLevel: stats.badgeLevel
        });

        // Get all investments to calculate category totals
        const investments = await contract.getInvestorInvestments(account);
        const categories = ['CRYPTO', 'STOCKS', 'COMMODITIES', 'BONDS'];
        
        // Calculate totals and changes by category
        const categoryTotals = {};
        for (let i = 0; i < categories.length; i++) {
          const categoryInvestments = investments.filter(inv => inv.category === i);
          const currentTotal = categoryInvestments.reduce((sum, inv) => 
            sum + parseFloat(ethers.formatUnits(inv.currentValue, 18)), 0);
          const initialTotal = categoryInvestments.reduce((sum, inv) => 
            sum + parseFloat(ethers.formatUnits(inv.amount, 18)), 0);
          
          const change = initialTotal > 0 ? 
            ((currentTotal - initialTotal) / initialTotal) * 100 : 0;

          categoryTotals[categories[i]] = {
            currentValue: currentTotal,
            change: change
          };
        }
        
        setCategoryData(categoryTotals);

        // Get historical performance
        const history = await contract.getHistoricalPerformance(30);
        const formattedHistory = history.values.map((value, index) => ({
          month: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' }),
          value: parseFloat(ethers.formatUnits(value, 18))
        }));
        setHistoricalData(formattedHistory);

        // Listen for events
        contract.on("InvestmentPerformance", (investor, id, prevValue, newValue, timestamp) => {
          if (investor === account) {
            loadContractData();
          }
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading contract data:", error);
        setLoading(false);
      }
    };

    loadContractData();
    
    return () => {
      // Cleanup event listeners
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      contract.removeAllListeners("InvestmentPerformance");
    };
  }, [account, contractAddress]);

  // Rest of the component remains the same...

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardContent>Please connect your wallet to view investments.</CardContent>
        </Card>
      </div>
    );
  }

  const totalChange = investorStats ? 
    ((parseFloat(investorStats.currentTotal) - parseFloat(investorStats.totalInvested)) / 
     parseFloat(investorStats.totalInvested) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="backdrop-blur-sm bg-white/10 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  {`${investorStats?.badgeLevel} Investor`}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {totalChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                <span className={`${totalChange >= 0 ? "text-green-400" : "text-red-400"} font-medium`}>
                  {totalChange.toFixed(2)}%
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/30">
                <p className="text-gray-400">Total Invested</p>
                <p className="text-2xl font-bold">
                  ${parseFloat(investorStats?.totalInvested || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/30">
                <p className="text-gray-400">Current Value</p>
                <p className="text-2xl font-bold">
                  ${parseFloat(investorStats?.currentTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="h-64 bg-gray-800/20 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickFormatter={(value) => `$${(value / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={{ fill: '#60A5FA', r: 4 }}
                    activeDot={{ r: 6, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(categoryData).map(([category, data]) => (
                <InvestmentCategory
                  key={category}
                  category={category}
                  currentValue={data.currentValue}
                  change={data.change}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
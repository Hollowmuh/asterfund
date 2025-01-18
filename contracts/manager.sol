// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FundManager is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    // Constants
    uint256 private constant SILVER_THRESHOLD = 500;
    uint256 private constant GOLD_THRESHOLD = 1000;
    uint256 private constant DIAMOND_THRESHOLD = 100000;
        uint256 private constant PLATINUM_THRESHOLD = 1000000;
    
    uint256 private constant MANAGEMENT_FEE_BPS = 200; // 2% annual management fee
    uint256 private constant PERFORMANCE_FEE_BPS = 2000; // 20% performance fee
    uint256 private constant BPS_DENOMINATOR = 10000;

    enum InvestmentCategory { CRYPTO, STOCKS, COMMODITIES, BONDS}
    enum BadgeLevel {BRONZE, SILVER, GOLD, DIAMOND, PLATINUM }
    IERC20 public immutable USDT;

     struct Investment {
        uint256 amount;
        uint256 currentValue;
        uint256 timestamp;
        uint256 lockedUntil;
        InvestmentCategory category;
    }

    struct Investor {
        uint256 totalInvested;
        uint256 rewardTokens;
        uint256 highWaterMark;
        uint256 totalWithdrawn;
        uint256 realizedProfit;
        uint256 totalFeePaid;
        uint256 lastDeposit;
        uint256 lastFeeCollection;
        BadgeLevel badgeLevel;
        Investment[] investments;
    }

    // State variables
    uint256 public totalFunds;
    uint256 public currentValue;
    address[] public investors;
    uint256[] public categoryInvestments;
    uint256 public minInvestment;
    uint256 public maxInvestment;
    uint256 public accumulatedFees;
    uint256 public totalInvestorsCount;
    uint256 public activeInvestorsCount;
    uint256 public totalValueLocked;
    uint256 public peakTotalValueLocked;
    uint256 public lastUpdateTimestamp;

    mapping(address => Investor) public investorInfo;

    // Events
    mapping(uint256 => uint256) public dailyTotalValue;
    mapping(uint256 => uint256) public dailyActiveInvestors;
    mapping(InvestmentCategory => uint256) public categoryTotalInvestments;
    event WithdrawalEvent(
        address indexed investor,
        uint256 amount,
        uint256 profit
    );

    event FeesCollectedEvent(
        uint256 amount,
        uint8 feeType
    );
    event PerformanceUpdate(
        uint256 timestamp,
        uint256 totalValue,
        uint256 dailyChange,
        uint256 activeInvestors
    );

    event InvestmentPerformance(
        address indexed investor,
        uint256 investmentId,
        uint256 previousValue,
        uint256 newValue,
        uint256 timestamp
    );

    event BadgeLevelChange(
        address indexed investor,
        BadgeLevel previousLevel,
        BadgeLevel newLevel
    );

    event NewPeakTVL(
        uint256 timestamp,
        uint256 amount
    );

    // Constructor
    constructor(address _usdtAddress,uint256 _minInvestment, uint256 _maxInvestment) Ownable(msg.sender) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        minInvestment = _minInvestment;
        maxInvestment = _maxInvestment;
        USDT = IERC20(_usdtAddress);
        categoryInvestments = new uint256[](3); // Initialize with zeros
        lastUpdateTimestamp = block.timestamp;
    }

    // Modifiers
    modifier validAmount(uint256 amount) {
        require(amount >= minInvestment, "Amount below minimum investment");
        require(amount <= maxInvestment, "Amount above maximum investment");
        _;
    }

    // Main functions
    function validateInvestmentCategory(InvestmentCategory _category) internal pure returns (bool) {
        return uint8(_category) <= uint8(InvestmentCategory.BONDS);
    }
    function createLockedInvestment(uint256 amount, uint256 lockDuration, InvestmentCategory _category) 
        external 
        payable
        nonReentrant
        whenNotPaused
        validAmount(amount)
    {
        require(lockDuration > 0, "Invalid timelock duration");
        require(validateInvestmentCategory(_category), "Invalid category");

        Investor storage investor = investorInfo[msg.sender];
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        Investment memory newInvestment = Investment({
            amount: amount,
            currentValue: amount,
            timestamp: block.timestamp,
            category: _category,
            lockedUntil: block.timestamp + lockDuration
        });
        categoryTotalInvestments[_category] += amount;
        if (investor.totalInvested == 0) {
            investors.push(msg.sender);
        }

        investor.investments.push(newInvestment);
        investor.totalInvested += amount;
        investor.lastDeposit = block.timestamp;
        
        if (investor.lastFeeCollection == 0) {
            investor.lastFeeCollection = block.timestamp;
        }

        totalFunds += amount;
        currentValue += amount;
        totalValueLocked += amount;
        
        _updateBadgeLevel(msg.sender);
        if (totalValueLocked > peakTotalValueLocked) {
            peakTotalValueLocked = totalValueLocked;
            emit NewPeakTVL(block.timestamp, totalValueLocked);
        }
    }

    function withdraw(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Investor storage investor = investorInfo[msg.sender];
        require(amount <= investor.totalInvested, "Invalid withdrawal amount");

        // Check timelocks
        for (uint i = 0; i < investor.investments.length; ++i) {
            require(
                block.timestamp >= investor.investments[i].lockedUntil,
                "Funds still locked"
            );
        }

        // Calculate profit for performance fee
        uint256 profit = 0;
        if (currentValue > investor.highWaterMark) {
            profit = currentValue - investor.highWaterMark;
        }

        // Collect fees before withdrawal
        _collectFees(msg.sender);

        totalFunds -= amount;
        investor.totalInvested -= amount;
        USDT.safeTransfer(msg.sender, amount);

        emit WithdrawalEvent(msg.sender, amount, profit);
    }

    function _collectFees(address investorAddress) internal {
        Investor storage investor = investorInfo[investorAddress];
        uint256 currentTime = block.timestamp;
        
        // Management fee calculation (prorated)
        uint256 timePassedInSeconds = currentTime - investor.lastFeeCollection;
        uint256 managementFee = (investor.totalInvested * MANAGEMENT_FEE_BPS * timePassedInSeconds) / 
            (BPS_DENOMINATOR * 365 days);
        
        // Performance fee calculation
        uint256 performanceFee = 0;
        if (currentValue > investor.highWaterMark) {
            performanceFee = ((currentValue - investor.highWaterMark) * PERFORMANCE_FEE_BPS) / 
                BPS_DENOMINATOR;
            investor.highWaterMark = currentValue;
        }

        if (managementFee > 0) {
            accumulatedFees += managementFee;
            emit FeesCollectedEvent(managementFee, 0);
        }

        if (performanceFee > 0) {
            accumulatedFees += performanceFee;
            emit FeesCollectedEvent(performanceFee, 1);
        }

        investor.lastFeeCollection = currentTime;
    }

    function _updateBadgeLevel(address investorAddress) internal {
        Investor storage investor = investorInfo[investorAddress];
        
        if (investor.totalInvested >= PLATINUM_THRESHOLD) {
            investor.badgeLevel = BadgeLevel.PLATINUM;
        }else if (investor.totalInvested >= DIAMOND_THRESHOLD) {
            investor.badgeLevel = BadgeLevel.DIAMOND; 
        }else if (investor.totalInvested >= GOLD_THRESHOLD) {
            investor.badgeLevel = BadgeLevel.GOLD;
        } else if (investor.totalInvested >= SILVER_THRESHOLD) {
            investor.badgeLevel = BadgeLevel.SILVER;
        } else {
            investor.badgeLevel = BadgeLevel.BRONZE;
        }
    }
    function updatePerformanceMetrics() public {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 previousValue = dailyTotalValue[currentDay - 1];
        
        dailyTotalValue[currentDay] = currentValue;
        dailyActiveInvestors[currentDay] = activeInvestorsCount;
        
        int256 dailyChange = int256(currentValue) - int256(previousValue);
        
        emit PerformanceUpdate(
            block.timestamp,
            currentValue,
            uint256(dailyChange),
            activeInvestorsCount
        );

        if (currentValue > peakTotalValueLocked) {
            peakTotalValueLocked = currentValue;
            emit NewPeakTVL(block.timestamp, currentValue);
        }
    }
    function getInvestorStats(address investor) 
        external 
        view 
        returns (
            uint256 totalInvested,
            uint256 currentTotal,
            uint256 unrealizedProfit,
            uint256 realizedProfit,
            uint256 totalFeePaid,
            BadgeLevel badgeLevel,
            uint256 investmentCount
        ) 
    {
        Investor storage inv = investorInfo[investor];
        uint256 currentTotal_ = 0;
        
        for (uint i = 0; i < inv.investments.length; i++) {
            currentTotal_ += inv.investments[i].currentValue;
        }
        
        return (
            inv.totalInvested,
            currentTotal_,
            currentTotal_ > inv.totalInvested ? currentTotal_ - inv.totalInvested : 0,
            inv.realizedProfit,
            inv.totalFeePaid,
            inv.badgeLevel,
            inv.investments.length
        );
    }
    function getFundMetrics() 
        external 
        view 
        returns (
            uint256 tvl,
            uint256 peakTvl,
            uint256 totalInvestors,
            uint256 activeInvestors,
            uint256[] memory categoryTotals,
            uint256 avgInvestmentSize
        ) 
    {
        return (
            totalValueLocked,
            peakTotalValueLocked,
            totalInvestorsCount,
            activeInvestorsCount,
            categoryInvestments,
            totalInvestorsCount > 0 ? totalValueLocked / totalInvestorsCount : 0
        );
    }
    function getHistoricalPerformance(uint256 daysBack) 
        external 
        view 
        returns (
            uint256[] memory values,
            uint256[] memory investorsCount
        ) 
    {
        require(daysBack > 0 && daysBack <= 365, "Invalid days range");
        
        uint256 currentDay = block.timestamp / 1 days;
        values = new uint256[](daysBack);
        investorsCount = new uint256[](daysBack);
        
        for (uint256 i = 0; i < daysBack; i++) {
            values[i] = dailyTotalValue[currentDay - i];
            investorsCount[i] = dailyActiveInvestors[currentDay - i];
        }
        
        return (values, investorsCount);
    }
    function getInvestorROI(address investor) 
        external 
        view 
        returns (
            uint256 totalROI,
            uint256 annualizedROI
        ) 
    {
        Investor storage inv = investorInfo[investor];
        uint256 currentTotal = 0;
        
        for (uint i = 0; i < inv.investments.length; i++) {
            currentTotal += inv.investments[i].currentValue;
        }
        
        if (inv.totalInvested == 0) return (0, 0);
        
        totalROI = ((currentTotal + inv.realizedProfit) * 10000 / inv.totalInvested) - 10000;
        
        uint256 timeInvested = block.timestamp - inv.investments[0].timestamp;
        if (timeInvested >= 365 days) {
            annualizedROI = (totalROI * 365 days) / timeInvested;
        } else {
            annualizedROI = totalROI;
        }
        
        return (totalROI, annualizedROI);
    }


    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawFees() external onlyOwner {
        uint256 feesToWithdraw = accumulatedFees;
        accumulatedFees = 0;
        USDT.safeTransfer(msg.sender, feesToWithdraw);
    }

    // View functions
    function getInvestorInvestments(address investor) 
        external 
        view 
        returns (Investment[] memory) 
    {
        return investorInfo[investor].investments;
    }
}
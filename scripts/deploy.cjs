require('dotenv').config();
const { ethers } = require("hardhat");

async function main() {
    // Retrieve deployer's private key from .env
    const deployerPrivateKey = process.env.PRIVATE_KEY;
    if (!deployerPrivateKey) {
        throw new Error("Please set your PRIVATE_KEY in a .env file");
    }

    const alchemyApiKey = process.env.INFURA_API_KEY;
    if (!alchemyApiKey) {
        throw new Error("Please set your PROJECT_ID in a .env file");
    }

    // Configure provider and wallet
    const provider = new ethers.InfuraProvider("sepolia", alchemyApiKey);
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    // const uniswapRouter = process.env.UNISWAP_ROUTER_ADDRESS;
    // const uniswapFactory = process.env.UNISWAP_FACTORY_ADDRESS;
    // const ngnaAddress = process.env.NGNATOKEN_ADDRESS;
    // const daiAddress = process.env.DAITOKEN_ADDRESS;
    // const usdtAddress = process.env.USDTTOKEN_ADDRESS;

    // Get the contract factoryProjectId
    // const addLiquidity = await ethers.getContractFactory("AddLiquidity", wallet);
    const FundManager = await ethers.getContractFactory("FundManager", wallet);
    const minimumEth = ethers.parseEther("10"); // 0.001 ETH
    const maximumEth = ethers.parseEther("10000000");    
    const usdt = '0xfD4Ef88580EA4379090dA6C31585944567da5688'
    console.log("Deploying Liquidity contracts...");

    // Deploy the contract
    // const AddLiquidity = await addLiquidity.deploy(uniswapRouter, ngnaAddress, usdtAddress, daiAddress);
    const fundManager = await FundManager.deploy(usdt, minimumEth, maximumEth);
    console.log("Fund contract deployed")

    // Wait for deployment to complete
    // await AddLiquidity.waitForDeployment();
    await fundManager.waitForDeployment();
    console.log("Fund Contract deployed to: ",await fundManager.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

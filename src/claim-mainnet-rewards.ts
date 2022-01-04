// imports
const { web3 } = require("hardhat");
const BigNumber = require("bignumber.js");

// JSONs
const IMoneyMarket = require("../abi/IMoneyMarket.json");
const CompoundLens = require("../abi/CompoundLens.json");
const ERC20 = require("../abi/ERC20.json");
const Rewards = require("../abi/Rewards.json");

// addresses
const fromAddress = "0xc0FcF8403e10B65f1D18f1B81b093004B1127275";
const compoundLensAddress = "0xd513d22422a3062Bd342Ae374b4b9c20E0a9a074";
const compAddress = "0xc00e94cb662c3520282e6f5717214004a7f26888";
const comptrollerAddress = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b";
const farmAddress = "0xa0246c9032bC3A600820415aE600c6388619A14D";

// constants
const PRECISION = 1e18;
const NETWORK_ID = 1;

async function main() {
  interface PoolInfo {
    name: string;
    address: string;
    stablecoin: string;
    stablecoinSymbol: string;
    stablecoinDecimals: number;
    protocol: string;
    iconPath: string;
    moneyMarket: string;
    stakingPool?: string;
    curveSwapAddress?: string;
    zapDepositTokens?: string[];
    interestFee?: number;
    depositFee?: number;
  }

  const getPoolInfo = (
    name: string,
    networkID: number = NETWORK_ID,
    v2: boolean = false
  ): PoolInfo => {
    return require(`../config/pools${v2 ? '-v2' : ''}.json`)[networkID][
      name
    ];
  }

  const getPoolInfoList = (
    networkID: number = NETWORK_ID,
    v2: boolean = false
  ): PoolInfo[] => {
    return Object.keys(
      require(`../config/pools${v2 ? '-v2' : ''}.json`)[networkID]
    ).map((pool) => getPoolInfo(pool, networkID, v2));
  }

  const getCompoundRewards = async () => {
    const compoundLens = new web3.eth.Contract(CompoundLens, compoundLensAddress);
    const compToken = new web3.eth.Contract(ERC20, compAddress);

    const allPoolsV2 = getPoolInfoList(NETWORK_ID, true);
    const allPoolsV3 = getPoolInfoList(NETWORK_ID);
    const allPools = allPoolsV2.concat(allPoolsV3);
    const compoundPools = allPools.filter(
      (poolInfo) => poolInfo.protocol === 'Compound'
    );

    let compRewardsToken = new BigNumber(0);
    const rewardPools: any[] = [];
    await Promise.all(
      compoundPools.map(async (poolInfo) => {
        let rewardsAmount = new BigNumber(0);
        // unclaimed rewards
        await compoundLens.methods
          .getCompBalanceMetadataExt(
            compAddress,
            comptrollerAddress,
            poolInfo.moneyMarket
          )
          .call()
          .then((result: any) => {
            const rewardUnclaimed = new BigNumber(result.allocated).div(
              PRECISION
            );
            compRewardsToken = compRewardsToken.plus(rewardUnclaimed);
            rewardsAmount = rewardsAmount.plus(rewardUnclaimed);
          });

        // claimed rewards
        await compToken.methods
          .balanceOf(poolInfo.moneyMarket)
          .call()
          .then((result: any) => {
            const rewardClaimed = new BigNumber(result).div(
              PRECISION
            );
            compRewardsToken = compRewardsToken.plus(rewardClaimed);
            rewardsAmount = rewardsAmount.plus(rewardClaimed);
          });

        if (rewardsAmount.gt(1)) {
          rewardPools.push(poolInfo.moneyMarket);
        }
      })
    )

    return rewardPools;
  }

  const getHarvestRewards = async () => {
    const farmToken = new web3.eth.Contract(ERC20, farmAddress);

    const allPoolsV2 = getPoolInfoList(NETWORK_ID, true);
    const allPoolsV3 = getPoolInfoList(NETWORK_ID);
    const allPools = allPoolsV2.concat(allPoolsV3);
    const harvestPools = allPools.filter(
      (poolInfo) => poolInfo.protocol === 'Harvest'
    );

    let farmRewardsToken = new BigNumber(0);
    const rewardPools: any[] = [];
    await Promise.all(
      harvestPools.map(async (poolInfo) => {
        let rewardsAmount = new BigNumber(0);
        // unclaimed rewards
        const stakingPool = new web3.eth.Contract(Rewards, poolInfo.stakingPool);
        await stakingPool.methods
          .earned(poolInfo.moneyMarket)
          .call()
          .then((result: any) => {
            const rewardUnclaimed = new BigNumber(result).div(
              PRECISION
            );
            farmRewardsToken = farmRewardsToken.plus(rewardUnclaimed);
            rewardsAmount = rewardsAmount.plus(rewardUnclaimed);
          });

        // claimed rewards
        await farmToken.methods
          .balanceOf(poolInfo.moneyMarket)
          .call()
          .then((result: any) => {
            const rewardClaimed = new BigNumber(result).div(
              PRECISION
            );
            farmRewardsToken = farmRewardsToken.plus(rewardClaimed);
            rewardsAmount = rewardsAmount.plus(rewardClaimed);
          });

        if (rewardsAmount.gt(1)) {
          rewardPools.push(poolInfo.moneyMarket);
        }
      })
    );
    return rewardPools;
  }

  // claim rewards
  const compoundRewardPools = await getCompoundRewards();
  const harvestRewardPools = await getHarvestRewards();

  let rewardMoneyMarkets: any[] = [];
  rewardMoneyMarkets = rewardMoneyMarkets.concat(compoundRewardPools);
  rewardMoneyMarkets = rewardMoneyMarkets.concat(harvestRewardPools);
  for (const moneyMarket of rewardMoneyMarkets) {
    console.log(`Claiming rewards from ${moneyMarket}`);
    const moneyMarketContract = new web3.eth.Contract(
      IMoneyMarket,
      moneyMarket
    );
    await moneyMarketContract.methods
      .claimRewards()
      .send({ from: fromAddress });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

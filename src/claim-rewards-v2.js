const rewardMoneyMarkets = require('../config/reward-money-markets-v2.json')
const IMoneyMarket = require('../abi/IMoneyMarket.json')
const { web3 } = require('hardhat')
const fromAddress = '0xc0FcF8403e10B65f1D18f1B81b093004B1127275'

async function main () {
  // claim rewards
  for (const moneyMarket of rewardMoneyMarkets) {
    console.log(`Claiming rewards from ${moneyMarket}`)
    const moneyMarketContract = new web3.eth.Contract(IMoneyMarket, moneyMarket)
    await moneyMarketContract.methods.claimRewards().send({ from: fromAddress })
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

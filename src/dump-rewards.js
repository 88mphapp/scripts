const rewardMoneyMarkets = require('../config/reward-money-markets.json')
const dumpTokens = require('../config/dump-tokens.json')
const IMoneyMarket = require('../abi/IMoneyMarket.json')
const Dumper = require('../abi/Dumper.json')
const { web3 } = require('hardhat')
const BigNumber = require('bignumber.js')
const dumperAddress = '0x5B3C81C86d17786255904c316bFCB38A46146ef8'
const fromAddress = '0xc0FcF8403e10B65f1D18f1B81b093004B1127275'
const minReturnMultiplier = 0.99

async function main () {
  // claim rewards
  for (const moneyMarket of rewardMoneyMarkets) {
    console.log(`Claiming rewards from ${moneyMarket}`)
    const moneyMarketContract = new web3.eth.Contract(IMoneyMarket, moneyMarket)
    await moneyMarketContract.methods.claimRewards().send({ from: fromAddress })
  }

  // dump
  const dumperContract = new web3.eth.Contract(Dumper, dumperAddress)
  for (const dumpToken of dumpTokens) {
    console.log(`Dumping ${dumpToken}`)
    const { returnAmount, distribution } = await dumperContract.methods.getDumpParams(dumpToken, 1).call()
    const minReturnAmount = BigNumber(returnAmount).times(minReturnMultiplier).integerValue().toFixed()
    await dumperContract.methods.dump(dumpToken, minReturnAmount, distribution).send({ from: fromAddress })
  }

  // distribute
  console.log('Distributing rewards')
  await dumperContract.methods.notify().send({ from: fromAddress })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

const { request, gql } = require('graphql-request')
const BigNumber = require('bignumber.js')
const fetch = require('node-fetch')
const { web3 } = require('hardhat')

const YEAR_IN_SEC = 31556952
const MPH = '0x8888801aF4d980682e47f1A9036e589479e835C5'
const graphqlEndpoint = 'https://api.thegraph.com/subgraphs/name/bacon-labs/eighty-eight-mph'
const APY = 1

const getTokenPriceUSD = async (address) => {
  if (address.toLowerCase() === '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858'.toLowerCase()) {
    // crvHUSD
    return 1
  } else if (address.toLowerCase() === '0xb19059ebb43466C323583928285a49f558E572Fd'.toLowerCase()) {
    // crvHBTC
    address = '0x0316EB71485b0Ab14103307bf65a021042c6d380'
  } else if (address.toLowerCase() === '0x2fE94ea3d5d4a175184081439753DE15AeF9d614'.toLowerCase()) {
    // crvOBTC
    address = '0x8064d9Ae6cDf087b1bcd5BDf3531bD5d8C537a68'
  } else if (address.toLowerCase() === '0x06325440D014e39736583c165C2963BA99fAf14E'.toLowerCase()) {
    // CRV:STETH
    address = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  } else if (address.toLowerCase() === '0x49849C98ae39Fff122806C06791Fa73784FB3675'.toLowerCase()) {
    // CRV:RENWBTC
    address = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  } else if (address.toLowerCase() === '0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3'.toLowerCase()) {
    // CRV:RENWSBTC
    address = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
  }
  const apiStr = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}/market_chart/?vs_currency=usd&days=0`
  const rawResult = await httpsGet(apiStr, 300)
  return rawResult.prices[0][1]
}

const httpsGet = async (apiStr, cacheMaxAge = 60) => {
  const request = await fetch(apiStr, { headers: { 'Cache-Control': `max-age=${cacheMaxAge}` } })
  return await request.json()
}

const dInterestAddresses = [
  '0x35966201A7724b952455B73A36C8846D8745218e', // Compound DAI
  '0x374226dbAa3e44bF3923AfB63f5Fd83928B7e148', // Compound USDC
  '0x19E10132841616CE4790920d5f94B8571F9b9341', // Compound UNI
  '0xe615e59353f70cA2424Aa0F24F49C639B8E924D3', // yearn yCRV
  '0x681Aaa7CF3F7E1f110842f0149bA8A4AF53Ef2Fd', // yearn crvSBTC
  // '0x23Fa6b36E870ca5753853538D17C3ca7f5269e84', // Harvest yCRV
  '0xe8C52367b81113ED32bb276184e521C2fbE9393A', // Aave USDC
  '0xb1ABAac351e06d40441CF2CD97F6f0098e6473F2', // Harvest CRV:HUSD
  '0x2F3EFD1a90a2336ab8fa1B9060380DC37361Ca55', // Harvest 3CRV
  '0x3f5611F7762cc39FC11E10C864ae38526f650e9D', // Harvest CRV:HBTC
  '0x6712BAab01FA2dc7bE6635746Ec2Da6F8Bd73e71', // Aave sUSD
  '0xDC86AC6140026267E0873B27c8629eFE748E7146', // Aave DAI
  '0xD4837145c7e13D580904e8431cfD481f9794fC41', // Harvest CRV:oBTC
  // '0x904F81EFF3c35877865810CCA9a63f2D9cB7D4DD', // yearn yaLINK
  '0x303CB7Ede0c3AD99CE017CDC3aBAcD65164Ff486', // Harvest CRV:STETH
  '0x22E6b9A65163CE1225D1F65EF7942a979d093039' // Harvest CRV:RENWBTC
]

async function main () {
  const getQueryForPool = poolAddress => {
    return gql`
    {
      dpool(id: "${poolAddress.toLowerCase()}") {
        stablecoin
        oneYearInterestRate
      }
    }
    `
  }

  const mphPrice = await getTokenPriceUSD(MPH)

  for (const pool of dInterestAddresses) {
    const query = getQueryForPool(pool)
    const result = await request(graphqlEndpoint, query)
    const interestRate = BigNumber(result.dpool.oneYearInterestRate)
    const token = result.dpool.stablecoin
    const tokenPrice = await getTokenPriceUSD(token)
    const tokenContract = new web3.eth.Contract(require('../abi/ERC20.json'), token)
    const tokenDecimals = +await tokenContract.methods.decimals().call()
    const multiplier = interestRate.times(APY).times(tokenPrice).div(YEAR_IN_SEC).div(mphPrice)
    const scaledMultiplier = multiplier.times(Math.pow(10, 36 - tokenDecimals)).integerValue()
    console.log(`${pool} ${scaledMultiplier.toFixed()}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

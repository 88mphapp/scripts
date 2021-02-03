const { request, gql } = require('graphql-request')
const BigNumber = require('bignumber.js')

async function main () {
  const getQueryStringAtBlock = blockNumber => {
    return gql`
    {
      markets(block: { number: ${blockNumber} }, where: {underlyingSymbol: "ChainLink Token"}) {
        exchangeRate
      }
    }
    `
  }

  const latestBlockNumber = 11785344
  const numQueries = 30
  const queryBlockInterval = Math.floor(24 * 60 * 60 / 15)
  const windowSize = 24 * 60 * 60
  const smoothingFactor = 2
  const numWindows = 30
  const updateMultiplier = smoothingFactor / (numWindows + 1)
  const graphqlEndpoint = 'https://api.thegraph.com/subgraphs/name/ksvirsky/cream'
  let lastExchangeRate = 0
  let ema = 0
  for (let index = numQueries; index >= 0; index--) {
    const blockNumber = latestBlockNumber - queryBlockInterval * index
    const query = getQueryStringAtBlock(blockNumber)
    const result = await request(graphqlEndpoint, query)
    const exchangeRate = BigNumber(result.markets[0].exchangeRate)
    if (lastExchangeRate === 0) {
      lastExchangeRate = exchangeRate
    } else {
      const incomingValue = exchangeRate.minus(lastExchangeRate).div(lastExchangeRate).div(windowSize)
      lastExchangeRate = exchangeRate
      if (ema === 0) {
        // bootstrap EMA with the first window's interest rate
        ema = incomingValue
      } else {
        // update EMA
        ema = incomingValue.times(updateMultiplier).plus(ema.times(1 - updateMultiplier))
      }
    }
  }
  console.log(ema.toFixed())
  console.log(ema.times(31556952).toFixed())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

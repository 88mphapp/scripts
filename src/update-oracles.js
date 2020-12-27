const oracles = require('../config/oracles.json')
const IInterestOracle = require('../abi/IInterestOracle.json')

async function main () {
  for (const oracleAddress of oracles) {
    const oracleContract = new web3.eth.Contract(IInterestOracle, oracleAddress)
    const callResult = await oracleContract.methods.updateAndQuery().call()
    if (callResult.updated) {
      // oracle can be updated, perform update
      console.log(`Updating oracle at ${oracleAddress}`)
      await oracleContract.methods.updateAndQuery().send()
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

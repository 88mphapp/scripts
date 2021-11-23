const hre = require("hardhat");
const { web3 } = hre;

const rewardMoneyMarkets = require("../config/reward-money-markets-v3.json")[hre.network.name];
const dumpTokens = require("../config/dump-tokens.json")[hre.network.name];
const IMoneyMarket = require("../abi/IMoneyMarket.json");
const Dumper = require("../abi/Dumper.json");
const BigNumber = require("bignumber.js");
const dumperAddress = "0x8Cc9ADF88fe0b5C739bD936E9edaAd30578f4265";
const fromAddress = "0xc0FcF8403e10B65f1D18f1B81b093004B1127275";
const minReturnMultiplier = 0.95;

async function main() {
    console.log(`--- Network: ${hre.network.name} ---`);

    // claim rewards
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

    // dump
    const dumperContract = new web3.eth.Contract(Dumper, dumperAddress);
    for (const dumpToken of dumpTokens) {
        console.log(`Dumping ${dumpToken}`);
        const { returnAmount, distribution } = await dumperContract.methods
            .getDumpParams(dumpToken, 1)
            .call();
        const minReturnAmount = BigNumber(returnAmount)
            .times(minReturnMultiplier)
            .integerValue()
            .toFixed();
        console.log(returnAmount, distribution, minReturnAmount);
        await dumperContract.methods
            .dump(dumpToken, minReturnAmount, distribution)
            .send({ from: fromAddress });
    }

    // distribute
    console.log("Distributing rewards");
    await dumperContract.methods.notify().send({ from: fromAddress });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

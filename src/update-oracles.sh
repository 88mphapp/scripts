networks=("avalanche" "fantom" "polygon" "mainnet")

for network in "${networks[@]}"; do
    HARDHAT_NETWORK=$network node src/update-oracles.js
done
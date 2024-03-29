require("@nomiclabs/hardhat-web3");

let secret;

try {
    secret = require("./secret.json");
} catch {
    secret = {
        account: "",
        mnemonic: "",
    };
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        version: "0.7.3",
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    networks: {
        mainnet: {
            url: "https://eth-mainnet.alchemyapi.io/v2/pvGDp1uf8J7QZ7MXpLhYs_SnMnsE0TY5",
            chainId: 1,
            from: secret.account,
            accounts: {
                mnemonic: secret.mnemonic,
            },
            gasMultiplier: 1.5,
        },
        polygon: {
            url: "https://polygon-rpc.com",
            chainId: 137,
            from: secret.account,
            accounts: {
                mnemonic: secret.mnemonic,
            },
            gasMultiplier: 1.5,
        },
        avalanche: {
            url: "https://api.avax.network/ext/bc/C/rpc",
            chainId: 43114,
            from: secret.account,
            accounts: {
                mnemonic: secret.mnemonic,
            },
            gasMultiplier: 1.5,
        },
        fantom: {
            url: "https://rpc.ftm.tools",
            chainId: 250,
            from: secret.account,
            accounts: {
                mnemonic: secret.mnemonic,
            },
            gasMultiplier: 1.5,
        },
    },
};

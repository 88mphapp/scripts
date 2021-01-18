const Web3 = require('web3')
const web3 = new Web3()

const queueTxFunctionObj = {
  inputs: [
    {
      internalType: 'address',
      name: 'target',
      type: 'address'
    },
    {
      internalType: 'uint256',
      name: 'value',
      type: 'uint256'
    },
    {
      internalType: 'string',
      name: 'signature',
      type: 'string'
    },
    {
      internalType: 'bytes',
      name: 'data',
      type: 'bytes'
    },
    {
      internalType: 'uint256',
      name: 'eta',
      type: 'uint256'
    }
  ],
  name: 'queueTransaction',
  outputs: [
    {
      internalType: 'bytes32',
      name: '',
      type: 'bytes32'
    }
  ],
  stateMutability: 'nonpayable',
  type: 'function'
}
const executeTransactionFunctionObj = {
  inputs: [
    {
      internalType: 'address',
      name: 'target',
      type: 'address'
    },
    {
      internalType: 'uint256',
      name: 'value',
      type: 'uint256'
    },
    {
      internalType: 'string',
      name: 'signature',
      type: 'string'
    },
    {
      internalType: 'bytes',
      name: 'data',
      type: 'bytes'
    },
    {
      internalType: 'uint256',
      name: 'eta',
      type: 'uint256'
    }
  ],
  name: 'executeTransaction',
  outputs: [
    {
      internalType: 'bytes',
      name: '',
      type: 'bytes'
    }
  ],
  stateMutability: 'payable',
  type: 'function'
}
const setPoolWhitelist = {
  constant: false,
  inputs: [
    {
      internalType: 'address',
      name: 'pool',
      type: 'address'
    },
    {
      internalType: 'bool',
      name: 'isWhitelisted',
      type: 'bool'
    }
  ],
  name: 'setPoolWhitelist',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}

const whitelistPoolAddress = '0xD4837145c7e13D580904e8431cfD481f9794fC41'
const eta = 1611016200

const target = '0x03577A2151A10675a9689190fE5D331Ee7ff2517'
const value = 0
const signature = ''
const data = web3.eth.abi.encodeFunctionCall(setPoolWhitelist, [whitelistPoolAddress, 'true'])
const calldata = web3.eth.abi.encodeFunctionCall(queueTxFunctionObj, [target, value, signature, data, eta])
console.log(calldata)

require('dotenv').config();
const { RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-deploy");
require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
     hardhat: {
         chainId: 1337,
     },
     goerli:{
       url: RPC_URL,
       accounts: [PRIVATE_KEY],
       chainId: 5,
       blockConfirmations: 6,
       gas: 6000000,
       gasPrice: 8000000000,
     },
  },
  solidity: "0.8.7",
  etherscan: {
    apiKey: {
      goerli: ETHERSCAN_API_KEY
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    // creo un secondo utente per i test in uint 
    player:{
      default: 1,
    }
  },
  mocha: {
    timeout: 5000000
  },
};
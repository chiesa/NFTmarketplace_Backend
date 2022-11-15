const { ethers } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESSES = "../nft_marketplace_frontend/constants/networkMapping.json"
const FRONT_END_ABI = "../nft_marketplace_frontend/constants/ABI.json"
const FRONT_END_BasicNFT2 = "../nft_marketplace_frontend/constants/BasicNft.json"

// questa funzione ci permette di aggiornare i dati del frontend
module.exports = async () => {
	if(process.env.UPDATE_FRONT_END){
		console.log("Updating front end.....")
		await updateContractAddresses()
		//await updateABI()
	}
}

async function updateContractAddresses(){
	const marketplace = await ethers.getContract("NFTmarketplace")
	const chainId = network.config.chainId.toString()
	const contractAddresses  = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES, "utf8"))
	if (chainId in contractAddresses){
		console.log((contractAddresses[chainId]["NFTMarketplace"])==marketplace.address)
		console.log((marketplace.address))
		if(!(contractAddresses[chainId]["NFTMarketplace"])==marketplace.address){
			contractAddresses[chainId]["NFTMarketplace"].push(marketplace.address)
		}
	} else {
		contractAddresses[chainId] = {"NFTMarketplace":[marketplace.address]}
	}
	fs.writeFileSync(FRONT_END_ADDRESSES, JSON.stringify(contractAddresses))
}

async function updateABI(){
	const marketplace = await ethers.getContract("NFTmarketplace")
    const nft = await ethers.getContract("BasicNFT2")
	fs.writeFileSync(FRONT_END_ABI, marketplace.interface.format(ethers.utils.FormatTypes.json))
	fs.writeFileSync(FRONT_END_BasicNFT2, nft.interface.format(ethers.utils.FormatTypes.json))
}

module.exports.tags = ["all", "frontend"]
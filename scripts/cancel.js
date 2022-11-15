const { ethers, network } = require("hardhat")

const TOKEN_ID = 0

async function cancel(){
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    const basicNft = await ethers.getContract("BasicNFT1")
    const tx =nftMarketplace.cancelListing(basicNft.address,TOKEN_ID)
    await tx.await(1)
    console.log("NFT Canceled!")
}

cancel()
    .then(()=> process.exit(0))
    .catch((err) => {
        console.error(err)
        process.emit(1)
    })
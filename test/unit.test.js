const { messagePrefix } = require("@ethersproject/hash")
const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace tests", () =>{
        let nftMarketplace, BasicNFT1, deployer, accounts, deployerSigner
        const PRICE = ethers.utils.parseEther("0.1")
        const TOKEN_ID = 0
        
        beforeEach(async () =>{
            // 2 player
            deployer = (await getNamedAccounts()).deployer
            //player = (await getNamedAccounts()).player oppure:
            accounts = await ethers.getSigners()
            player = accounts[1]
            // deploy all
            await deployments.fixture(["all"])
            // get contract 
            nftMarketplace = await ethers.getContract("NFTmarketplace")
            BasicNFT1 = await ethers.getContract("BasicNFT1")
            // NOTA: 
            // call a function with a different not the deployer but the player define in hardhat.config.js
            // nftMarketplace = await nftMarketplace.connect(player)
            await BasicNFT1.mintNft()
            await BasicNFT1.approve(nftMarketplace.address, TOKEN_ID) // approve funziona perchè è il deployer che fa la richiesta ed è lo stesso address che fa il mint
        })

        it("list and can be bought", async () => {
            console.log("")
            await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
            const playerNftMarketplace = await nftMarketplace.connect(player)
            await playerNftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
            const newOwner = await BasicNFT1.ownerOf( TOKEN_ID )
            const deployerProcess = await nftMarketplace.getAccountBalance(deployer)
            assert(newOwner.toString() == player.address)
            assert(deployerProcess.toString() == PRICE.toString())
        })

        /* listItem */
        describe("listItem", () => {

            it("contratto senza approvazione per il token", async () => {
                const BasicNFT2 = await ethers.getContract("BasicNFT2")
                await BasicNFT2.mintNft()
                await expect(nftMarketplace.listItem(nftMarketplace, TOKEN_ID, PRICE)).to.be.reverted
            })
            it("prezzo 0", async () => {
                await expect(nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, 0)).to.be.revertedWith("NFT_marketplace__invalidPrice")
            })
            it("l'owner del NFT non è msg.sender", async () => {
                nftMarketplace = await nftMarketplace.connect(player)
                await expect(nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)).to.be.revertedWith("NFT_marketplace__ownerChange")
            })
            it("l'owner del NFT non è msg.sender", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                await expect(nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)).to.be.revertedWith("NFT_marketplace__alreadyList")
            })
            it("controllo prezzo e owner", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                const price = await nftMarketplace.getNFTPrice(BasicNFT1.address, TOKEN_ID)
                const owner = await nftMarketplace.getNFTLister(BasicNFT1.address, TOKEN_ID)
                assert.equal(price.toString(), PRICE.toString())
                assert.equal(owner, deployer)
            })
            it("evento NFTSold", async () =>{
                await expect((await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE))).to.emit(nftMarketplace,"NFTlisted")
            })
        })

        /* buyItem */
        describe("buyItem", () => {

            it("contratto senza approvazione per il token", async () => {
                const BasicNFT2 = await ethers.getContract("BasicNFT2")
                await BasicNFT2.mintNft()
                await expect(nftMarketplace.listItem(nftMarketplace, TOKEN_ID, PRICE)).to.be.reverted
            })
            it("prezzo 0", async () => {
                await expect(nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, 0)).to.be.revertedWith("NFT_marketplace__invalidPrice")
            })
            it("l'owner del NFT è cambiato", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)    
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
                nftMarketplace = await nftMarketplace.connect(deployer)
                await expect(nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)).to.be.reverted
            })
            it("importo inviato non valido", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                nftMarketplace = await nftMarketplace.connect(player)
                const newPrice = PRICE - ethers.utils.parseEther("0.0001")
                await expect(nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: newPrice.toString()})).to.be.revertedWith("NFT_marketplace__invalidPrice")
            })
            it("NFT eliminato", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value:PRICE})
                await assert.equal(nftMarketplace.getNFTPrice(BasicNFT1.address, TOKEN_ID)>0,false)
            })
            it("incremento credito del venditore e cambio dell'owner del NFT", async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value:PRICE})
                await assert.equal((await nftMarketplace.getAccountBalance(deployer)).toString(),PRICE.toString())
                await assert.equal((await BasicNFT1.ownerOf( TOKEN_ID )), player.address)
            })
            it("evento NFTSold", async () =>{
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                nftMarketplace = await nftMarketplace.connect(player)
                await expect((await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value:PRICE}))).to.emit(nftMarketplace,"NFTSold")
            })
        })

        /* deleteListing */
        describe("deleteListing", () => {
            beforeEach(async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
            })

            it("contratto senza approvazione per il token", async () => {
                await expect(nftMarketplace.listItem(nftMarketplace, TOKEN_ID, PRICE)).to.be.reverted
            })
            it("NFT non listato", async () => {
                nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID)
                await expect(nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID)).to.be.revertedWith("NFT_marketplace__invalidPrice")
            })
            it("l'owner del NFT è cambiato", async () => {   
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
                nftMarketplace = await nftMarketplace.connect(deployer)
                await expect(nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID)).to.be.reverted
            })
            it("NFT eliminato", async () => {
                await nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID)
                await assert.equal(nftMarketplace.getNFTPrice(BasicNFT1.address, TOKEN_ID)>0,false)
            })
            it("evento listDeleted", async () =>{
                await expect((await nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID))).to.emit(nftMarketplace,"listDeleted")
            })
        })

        /* updateListing */
        describe("updateListing", () => {
            beforeEach(async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
            })
            it("il prezzo è 0 (NFT eliminato)", async () => {
                await nftMarketplace.deleteListing(BasicNFT1.address, TOKEN_ID)
                await expect(nftMarketplace.updateListing(BasicNFT1.address, TOKEN_ID, PRICE)).to.be.reverted
            })
            it("cambio di owner", async () => {   
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
                nftMarketplace = await nftMarketplace.connect(deployer)
                await expect(nftMarketplace.updateListing(BasicNFT1.address, TOKEN_ID)).to.be.reverted
            })
            it("sender non è owner", async () => {   
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
                nftMarketplace = await nftMarketplace.connect(accounts[2].address)
                await expect(nftMarketplace.updateListing(BasicNFT1.address, TOKEN_ID)).to.be.reverted
            })
            it("evento updateListing", async () =>{
                await expect((await nftMarketplace.updateListing(BasicNFT1.address, TOKEN_ID, PRICE))).to.emit(nftMarketplace,"listingUpdate")
            })
        })

        /* withdraw */
        describe("withdraw", () => {
            beforeEach(async () => {
                await nftMarketplace.listItem(BasicNFT1.address, TOKEN_ID, PRICE)
                nftMarketplace = await nftMarketplace.connect(player)
                await nftMarketplace.buyItem(BasicNFT1.address, TOKEN_ID, {value: PRICE})
                deployerSigner = await ethers.getSigner(deployer)
            })
            it("No withdraw disponibili", async () => {
                await expect(nftMarketplace.withdraw()).to.be.revertedWith("NFT_marketplace__invalidWithdraw")
            })
            it("Credito eliminato", async () => { 
                nftMarketplace = await nftMarketplace.connect(deployerSigner)
                await nftMarketplace.withdraw()
                await assert.equal((await nftMarketplace.getAccountBalance(deployer))>0,false)
            })
            it("evento withdrawSuccess", async () =>{
                nftMarketplace = await nftMarketplace.connect(deployerSigner)
                await expect((await nftMarketplace.withdraw())).to.emit(nftMarketplace,"withdrawSuccess")
            })
        })
        
/*
	
5. withdraw:
	- `il prezzo è 0` 
            => revert NFT_marketplace__invalidNFT()
	- `NFT eliminato` 
            => l'NFT viene eliminato, quindi cercando il prezzo (getNFTPrice()) e/o l'owner (getNFTLister()) => revert

	- `saldo 0`: 
            a seguito di un prelievo soldi sul contratto = 0         
        */
    })
const { network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { verify } = require("../../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    arguments = []
    console.log(deployer)
    const BasicNFT1 = await deploy("BasicNFT1", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    const BasicNFT2 = await deploy("BasicNFT2", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(BasicNFT1.address, arguments)
    }
}

module.exports.tags = ["all", "createNFT", "main"]
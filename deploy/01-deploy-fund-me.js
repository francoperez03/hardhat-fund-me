const { networkConfig, developmentChains } = require('../helper-hardhat-config')
const { network } = require('hardhat')
const { verify } = require('../utils/verify')
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log, get } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	log('--------------------01-START-------------')
	let ethUsdPriceFeedAddres
	if (developmentChains.includes(network.name)) {
		const ethUsdAggregator = await deployments.get('MockV3Aggregator')
		ethUsdPriceFeedAddres = ethUsdAggregator.address
	} else {
		ethUsdPriceFeedAddres = networkConfig[chainId]['ethUsdPriceFeed']
	}
	const args = [ethUsdPriceFeedAddres]
	const fundMe = await deploy('FundMe', {
		from: deployer,
		args: args,
		log: true,
		blockConfirmations: network.config.blockConfirmations || 1
	})
	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		await verify(fundMe.address, args)
	}
	log('--------------------01-END-------------')
}

module.exports.tags = ['all', 'fundMe']

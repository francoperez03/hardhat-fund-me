const { network } = require('hardhat')
const {
	developmentChains,
	DECIMALS,
	INITAL_ANSWER
} = require('../helper-hardhat-config')

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	console.log({ developmentChains })
	if (developmentChains.includes(network.name)) {
		log('----------START----------------')
		log('Local network detected! Deploying mocks...')
		await deploy('MockV3Aggregator', {
			contract: 'MockV3Aggregator',
			from: deployer,
			args: [DECIMALS, INITAL_ANSWER],
			log: true
		})
		log('Mocks deployed!')
		log('---------------------------------------------')
	}
}

module.exports.tags = ['all', 'mocks']

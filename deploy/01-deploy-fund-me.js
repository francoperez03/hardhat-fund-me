//import
//main function
//calling of main function`
// function deployFunc() {
// 	console.log('Hi!')
// }
// module.exports.default = deployFunc
const { networkConfig } = require('../helper-hardhat-config')
const { network } = require('hardhat')
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	const ethUsdPriceFeedAddres = networkConfig[chainId]['ethUsdPriceFeed']
	//well what happens when we want to change chains?
	//when going for localhost or hardhat network we want to use a mock
	console.log({ ethUsdPriceFeedAddres })
	const fundMe = await deploy('FundMe', {
		from: deployer,
		args: [],
		log: true
	})
}

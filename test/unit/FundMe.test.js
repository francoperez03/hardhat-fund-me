const { assert, expect } = require('chai')
const { deployments, ethers, getNamedAccounts, network } = require('hardhat')

describe('FundMe', () => {
	let fundMe
	let deployer
	let mockV3Aggregator
	const sendValue = ethers.utils.parseEther('1')
	beforeEach(async () => {
		// const accounts = await ethers.getSigners()
		// const accountZero = accounts[0]
		deployer = (await getNamedAccounts()).deployer
		await deployments.fixture(['all'])
		fundMe = await ethers.getContract('FundMe', deployer)
		mockV3Aggregator = await ethers.getContract(
			'MockV3Aggregator',
			deployer
		)
	})
	describe('constructor', () => {
		it('sets the aggregator addresses correctly', async () => {
			const response = await fundMe.i_priceFeed()
			assert.equal(response, mockV3Aggregator.address)
		})
	})

	describe('fund', async () => {
		it("Fails if you don't send enough ETH", async () => {
			await expect(fundMe.fund()).to.be.revertedWith(
				'You need to spend more ETH!'
			)
		})
		it('updated the amount funded data structure', async () => {
			await fundMe.fund({ value: sendValue })
			const response = await fundMe.s_addressToAmountFunded(deployer)
			assert.equal(response.toString(), sendValue.toString())
		})
		it('Adds funder to array of funders', async () => {
			await fundMe.fund({ value: sendValue })
			const funder = await fundMe.s_funders(0)
			assert.equal(funder, deployer)
		})
	})
	describe('withdraw', () => {
		beforeEach(async () => {
			await fundMe.fund({ value: sendValue })
		})

		it('withdraw ETH from a single founder', async () => {
			//arrange
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			//act
			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)
			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			//assert
			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				startingFundMeBalance.add(startingDeployerBalance).toString(),
				endingDeployerBalance.add(gasCost).toString()
			)
		})
		it('allows us to withdraw with multiple funders', async () => {
			const accounts = await ethers.getSigners()
			for (let i = 1; i < 6; i++) {
				const fundMeConnectedContract = await fundMe.connect(
					accounts[i]
				)
				await fundMeConnectedContract.fund({ value: sendValue })
			}
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			//Act
			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)

			//Assert
			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			//assert
			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				startingFundMeBalance.add(startingDeployerBalance).toString(),
				endingDeployerBalance.add(gasCost).toString()
			)
			//Make sure that the funders reset properly
			await expect(fundMe.s_funders(0)).to.be.reverted
			for (i = 1; i < 6; i++) {
				assert.equal(
					await fundMe.s_addressToAmountFunded(accounts[i].address),
					0
				)
			}
		})
		it('Only allows the owner to withdraw', async () => {
			const accounts = await ethers.getSigners()
			const attacker = accounts[1]

			const attackerConnectedContract = await fundMe.connect(attacker)
			await expect(
				attackerConnectedContract.withdraw()
			).to.be.revertedWith('FundMe__NotOwner')
		})
	})
})

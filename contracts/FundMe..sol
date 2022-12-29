// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

error FundMe__NotOwner();

/** @title A contract for crowd funding
 *  @author Franco Perez
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feed as our library
 */

contract FundMe {
	using PriceConverter for uint256;

	mapping(address => uint256) public s_addressToAmountFunded;
	address[] public s_funders;
	address public immutable i_owner;
	uint256 public constant MINIMUM_USD = 5 * 1 ether;
	AggregatorV3Interface public immutable i_priceFeed;

	modifier onlyOwner() {
		if (msg.sender != i_owner) revert FundMe__NotOwner();
		_;
	}

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		i_priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	/**
	 *  @notice This function funds this contract
	 */
	function fund() public payable {
		require(
			msg.value.getConversionRate(i_priceFeed) >= MINIMUM_USD,
			'You need to spend more ETH!'
		);
		s_addressToAmountFunded[msg.sender] += msg.value;
		s_funders.push(msg.sender);
	}

	function withdraw() public onlyOwner {
		address[] memory funders = s_funders;
		for (
			uint256 funderIndex = 0;
			funderIndex < funders.length;
			funderIndex++
		) {
			address funder = funders[funderIndex];
			s_addressToAmountFunded[funder] = 0;
		}
		s_funders = new address[](0);
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}('');
		require(callSuccess, 'Call failed');
	}

	function getVersion() public view returns (uint256) {
		return i_priceFeed.version();
	}
}

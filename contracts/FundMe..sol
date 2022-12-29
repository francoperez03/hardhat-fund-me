// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

error FundMe__NotOwner();
error FundMe__CallFailed();
error FundMe__MinimunNotSent();

/** @title A contract for crowd funding
 *  @author Franco Perez
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feed as our library
 */

contract FundMe {
	using PriceConverter for uint256;

	mapping(address => uint256) private s_addressToAmountFunded;
	address[] private s_funders;
	address private immutable i_owner;
	uint256 private constant MINIMUM_USD = 5 * 1 ether;
	AggregatorV3Interface private immutable i_priceFeed;

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
		if (msg.value.getConversionRate(i_priceFeed) < MINIMUM_USD) {
			revert FundMe__MinimunNotSent();
		}
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
		if (!callSuccess) revert FundMe__CallFailed();
	}

	function getOwner() public view returns (address) {
		return i_owner;
	}

	function getFunder(uint256 index) public view returns (address) {
		return s_funders[index];
	}

	function getAddressToAmountFunded(
		address funder
	) public view returns (uint256) {
		return s_addressToAmountFunded[funder];
	}

	function getPriceFeed() public view returns (AggregatorV3Interface) {
		return i_priceFeed;
	}
}

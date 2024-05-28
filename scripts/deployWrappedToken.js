const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const TokenContract = await hre.ethers.getContractFactory("WrappedToken");
  const tokenContract = await TokenContract.deploy();
  await tokenContract.deployed();
  console.log("Wrapped token contract deployed to:", tokenContract.address);
  fs.writeFileSync('./config3.js', `
  export const wrappedTokenAddress = "${tokenContract.address}"
`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

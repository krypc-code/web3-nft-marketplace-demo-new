const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const TokenContract = await hre.ethers.getContractFactory("KrypcToken");
  const tokenContract = await TokenContract.deploy(1000000);
  await tokenContract.deployed();
  console.log("Token contract deployed to:", tokenContract.address);
  fs.writeFileSync('./config2.js', `
  export const erc20tokenAddress = "${tokenContract.address}"
`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

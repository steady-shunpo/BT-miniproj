
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new JsonRpcProvider("http://127.0.0.1:8545");

// Use an account private key printed by your LOCAL Hardhat node.
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Set DEPLOYER_PRIVATE_KEY first");
}

const signer = new Wallet(privateKey, provider);

const artifact = JSON.parse(
  await readFile(
    "./artifacts/contracts/Voting.sol/Voting.json",
    "utf8"
  )
);

const factory = new ContractFactory(
  artifact.abi,
  artifact.bytecode,
  signer
);

const contract = await factory.deploy(["Alice", "Bob", "Charlie"]);
await contract.waitForDeployment();

console.log("Voting contract deployed at:", await contract.getAddress());
console.log("Admin address:", await signer.getAddress());

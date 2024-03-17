import { ethers } from "ethers";
import Escrow from "./artifacts/contracts/Escrow.sol/Escrow";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";
import { useCookies } from "react-cookie";
import { approve } from "./App";

async function deploy(signer, arbiter, beneficiary, value) {
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );

  // deploy the contract to the blockchain
  let escrow = factory
    .deploy(arbiter, beneficiary, { value })
    .then((tx) => {
      console.log("deploy - address - Works: ", tx.address);
      return tx;
    })
    .catch((error) => {
      const parsedEthersError = getParsedEthersError(error);
      if (parsedEthersError.errorCode === "REJECTED_TRANSACTION") {
        console.log("deploy - Transaction was rejected");
      } else {
        console.log("deploy - context - Debug: ", parsedEthersError.context);
      }
    });
  return escrow;
}

/**
 * load the escrow contracts from the blockchain with the given escrowAddresses
 * @param signer
 * @param escrowAddresses
 * @returns {Promise<*[]|boolean>}
 */
async function getEscrowContract(signer, escrowAddresses, setApproveLoading) {
  if (!signer || !escrowAddresses) return false;

  // go through the list of deployed escrow contracts and save the values in the escrowObjectArray
  const escrowObjectArray = [];
  for (let i = 0; i < escrowAddresses.length; i++) {
    const escrowAddress = escrowAddresses[i];
    const tokenContract = new ethers.Contract(
      escrowAddress,
      Escrow.abi,
      signer
    );
    // load the contract from the blockchain and ask for the values
    const contract = await tokenContract.connect(signer);
    const arbiter = await contract.arbiter();
    const beneficiary = await contract.beneficiary();
    const isApproved = await contract.isApproved();
    const balance = await contract.provider.getBalance(escrowAddress);

    // build up the escrow object
    escrowObjectArray.push({
      address: escrowAddress,
      arbiter: arbiter,
      beneficiary: beneficiary,
      value: balance,
      handleApprove: async () => {
        contract.on("Approved", () => {
          document.getElementById(contract.address).className = "complete";
          document.getElementById(contract.address).innerText =
            "✓ It's been approved!";
        });
        console.log("Before approve");
        await approve(contract, signer, setApproveLoading);
      },
      isApproved,
    });
  }
  return escrowObjectArray;
}

export { deploy, getEscrowContract };

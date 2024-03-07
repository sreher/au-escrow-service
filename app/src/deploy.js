import {ethers} from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';
import {getParsedEthersError} from "@enzoferey/ethers-error-parser";
import { useCookies } from 'react-cookie';
import {approve} from "./App";

async function deploy(signer, arbiter, beneficiary, value) {
    const factory = new ethers.ContractFactory(
        Escrow.abi,
        Escrow.bytecode,
        signer
    );

    console.log("deploy - Before deploy !!!");
    return factory.deploy(arbiter, beneficiary, {value})
        .then(tx => {
            console.log("deploy - Works: ", tx);
            console.log("deploy - address - Works: ", tx.address);
            return tx;
        })
        .catch(error => {
            const parsedEthersError = getParsedEthersError(error);
            if (parsedEthersError.errorCode === "REJECTED_TRANSACTION") {
                console.log("deploy - Transaction was rejected");
            } else {
                // console.log("deploy - Debug after deploy: ", parsedEthersError);
                console.log("deploy - context - Debug after deploy: ", parsedEthersError.context);
            }
        });
}

async function getEscrowContract(signer, escrowAddress) {
    if (!signer || !escrowAddress) return false;
    const tokenContract = new ethers.Contract(escrowAddress, Escrow.abi, signer);
    const contract = await tokenContract.connect(signer);
    const arbiter = await contract.arbiter();
    const beneficiary = await contract.beneficiary();
    const isApproved = await contract.isApproved();
    const balance = await contract.provider.getBalance(escrowAddress);

    const escrowObject = {
        address: escrowAddress,
        arbiter: arbiter,
        beneficiary: beneficiary,
        value: balance,
        handleApprove: async () => {
            contract.on('Approved', () => {
                document.getElementById(contract.address).className =
                    'complete';
                document.getElementById(contract.address).innerText =
                    "✓ It's been approved!";
            })
            console.log("Before approve");
            await approve(contract, signer);
        },
    };

    return escrowObject;
}

export { deploy, getEscrowContract };
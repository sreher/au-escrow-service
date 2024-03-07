// add the game address here and update the contract name if necessary
// const contractAddr = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0s";
const contractAddr = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
const contractName = "Escrow";

async function main() {
    // attach to the escrow
    const escrow = await hre.ethers.getContractAt(contractName, contractAddr);
    console.log("escrow: ", escrow);

    /*
    const arbiter = await escrow.arbiter();
    await arbiter.wait();
    console.log("arbiter: ", arbiter);
    const beneficiary = await escrow.beneficiary();
    await beneficiary.wait();
    console.log("beneficiary: ", beneficiary);
    const isApproved = await escrow.isApproved();
    await isApproved.wait();
    console.log("isApproved: ", isApproved);
    // const balance = await escrow.;
    */
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

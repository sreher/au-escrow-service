import {ethers} from 'ethers';
import {useEffect, useState} from 'react';
import { deploy, getEscrowContract } from './deploy';
import Escrow from './Escrow';
import { useCookies } from 'react-cookie';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
    const approveTxn = await escrowContract.connect(signer).approve();
    await approveTxn.wait();
}

function App() {
    const [account, setAccount] = useState();
    const [signer, setSigner] = useState();
    const [cookies, setCookie] = useCookies(['escrow']);
    const [escrows, setEscrows] = useState([]);

    useEffect(() => {
        async function getAccounts() {
            const accounts = await provider.send('eth_requestAccounts', []);
            console.log("getAccounts - %s", accounts[0]);

            setAccount(accounts[0]);
            setSigner(provider.getSigner());
        }

        async function getAppEscrowContract() {
            if (cookies.escrow && cookies.escrow.length === 42) {
                if (escrows.address !== cookies.escrow && signer) {
                    getEscrowContract(signer, cookies.escrow).then(escrow => {
                        setEscrows([...escrows, escrow]);
                        console.log("Escrows - loaded from Cookie Address:  ", escrow);
                    });
                }
            }
        }

        getAccounts();
        getAppEscrowContract();
    }, [account]);

    // useEffect(() => {
    //     console.log("App reloaded");
    //     if(cookies.escrow === undefined && cookies.escrow && cookies.escrow.length === 42) {
    //         const escrowAddress = cookies.escrow;
    //         console.log("escrows address:  ", escrowAddress);
    //         console.log("escrows.address:  ", escrows.address);
    //         if(escrows.address !== escrowAddress) {
    //             getEscrowContract(signer, escrowAddress).then(escrow => {
    //                 // setEscrows([...escrows, escrow]);
    //                 console.log("escrows spez - loaded:  ", escrow);
    //             });
    //         }
    //     }
    // }, [cookies.escrow === undefined]);

    async function newContract() {
        const beneficiary = document.getElementById('beneficiary').value;
        const arbiter = document.getElementById('arbiter').value;
        const value = ethers.utils.parseUnits(document.getElementById('ether').value, "ether");
        console.log("newContract -- Before deploy !!!");

        const escrowContract = await deploy(signer, arbiter, beneficiary, value)
            .then(tx => {
                console.log("newContract - WORKS !!!", tx);
                return tx;
            }).catch(e => {
                console.log("newContract - Fehler !!!!!", e);
                if (e.code === 4001) {
                    console.log("newContract - 4001 Fehler !!!");
                }
            });

        const escrow = {
            address: escrowContract.address,
            arbiter,
            beneficiary,
            value: value.toString(),
            handleApprove: async () => {
                escrowContract.on('Approved', () => {
                    document.getElementById(escrowContract.address).className =
                        'complete';
                    document.getElementById(escrowContract.address).innerText =
                        "✓ It's been approved!";
                })
                console.log("Before approve");
                await approve(escrowContract, signer);
            },
        };
        console.log("escrow set!");
        setEscrows([...escrows, escrow]);
        if (escrow) {
            console.log("Escrows", escrows);
            setCookie('escrow', escrow.address);
        }
    }

    return (
        <>
            <div className="contract">
                <h1> New Contract </h1>
                <label>
                    Arbiter Address
                    <input type="text" id="arbiter"/>
                </label>

                <label>
                    Beneficiary Address
                    <input type="text" id="beneficiary"/>
                </label>

                <label>
                    Deposit Amount (in Ether)
                    <input type="text" id="ether"/>
                </label>

                <label>
                    Deployed Address
                    <p>{cookies.escrow ? cookies.escrow : ''}</p>
                </label>
                <div
                    className="button"
                    id="deploy"
                    onClick={(e) => {
                        e.preventDefault();

                        newContract();
                    }}
                >
                    Deploy
                </div>
            </div>

            <div className="existing-contracts">
                <h1> Existing Contracts </h1>

                <div id="container">
                    {escrows.map((escrow) => {
                        return <Escrow key={escrow.address} {...escrow} />;
                    })}
                </div>
            </div>
        </>
    );
}

export default App;

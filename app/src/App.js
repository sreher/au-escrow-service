import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { deploy, getEscrowContract } from "./deploy";
import Escrow from "./Escrow";
import { Cookies, useCookies } from "react-cookie";
import { Button } from "antd";
import { Layout, Flex, Typography } from "antd";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";

const { Header, Footer, Sider, Content } = Layout;

// local provider
const provider = new ethers.providers.Web3Provider(window.ethereum);

/**
 * Connect to the blockchain and execute the approve function of the contract
 * @param escrowContract
 * @param signer
 * @param setApproveLoading
 * @returns {Promise<void>}
 */
export async function approve(escrowContract, signer, setApproveLoading) {
  setApproveLoading(true);
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
  setApproveLoading(false);
}

// inline styles for the layout
// TODO: move this values to the css file
const headerStyle = {
  textAlign: "center",
  color: "#fff",
  backgroundColor: "#7770b3",
  height: "95px",
};
const contentStyle = {
  textAlign: "center",
  color: "#555",
  backgroundColor: "#ddd",
  width: "64vw",
};
const siderStyle = {
  textAlign: "center",
  color: "#555",
  backgroundColor: "#ddd",
};
const footerStyle = {
  textAlign: "center",
  color: "#fff",
  backgroundColor: "#7770b3",
};
const layoutStyle = {
  // overflow: "hidden",
  width: "100%",
  height: "100%",
};

function App() {
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [cookies, setCookie] = useCookies(["escrow"]);
  const [escrows, setEscrows] = useState([]);
  const [deployLoading, setDeployLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const { Title } = Typography;

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    /**
     * Check if there is a escrow cookie and try to load the contract
     * @returns {Promise<void>}
     */
    async function getAppEscrowContract() {
      if (
        escrows.length === 0 &&
        signer &&
        cookies.escrow &&
        cookies.escrow.length !== 0
      ) {
        // delegate the loading to the deploy.js file
        getEscrowContract(signer, cookies.escrow, setApproveLoading).then(
          (escrow) => {
            setEscrows([...escrow]);
          }
        );
      }
      setDeployLoading(false);
    }

    getAccounts();
    getAppEscrowContract();
  }, [account]);

  async function newContract() {
    // start spinner
    setDeployLoading(true);
    // get values from input elements
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    // interpret the input as ether
    const value = ethers.utils.parseUnits(
      document.getElementById("ether").value,
      "ether"
    );

    // start deploying the contract
    const escrowContract = await deploy(signer, arbiter, beneficiary, value)
      .then((tx) => {
        return tx;
      })
      .catch((error) => {
        const parsedEthersError = getParsedEthersError(error);
        if (parsedEthersError.errorCode === "REJECTED_TRANSACTION") {
          console.log("newContract - Transaction was rejected");
        } else {
          console.log("newContract - error: ", parsedEthersError.context);
        }
      });

    // build the object structure of the escrow frontend display
    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });
        await approve(escrowContract, signer, setApproveLoading);
      },
      approveLoading,
      isApproved: false,
    };

    setEscrows([...escrows, escrow]);

    // make the escrows persistent, so when you refresh the page, the escrow smart contracts are not gone!
    let cookieArray = [];
    if (cookies.escrow && cookies.escrow.length > 0) {
      cookieArray = Array.from(cookies.escrow);
    }
    cookieArray.push(escrow.address);
    setCookie("escrow", cookieArray);
    /*
    if (cookies.escrow) {
      const cookieEscrow = cookies.escrow;
    }
    */
    setDeployLoading(false);
  }

  return (
    <Layout style={layoutStyle}>
      <Header as="h1" style={headerStyle}>
        <Title style={{ color: "white" }}>Escrow Service</Title>
      </Header>
      <Layout>
        <Sider width="35vw" style={siderStyle}>
          <div className="contract">
            <h2> New Contract </h2>
            <label>
              Arbiter Address
              <input type="text" id="arbiter" />
            </label>

            <label>
              Beneficiary Address
              <input type="text" id="beneficiary" />
            </label>

            <label>
              Deposit Amount (in Ether)
              <input type="text" id="ether" />
            </label>
            <Button
              id="deploy"
              type="primary"
              loading={deployLoading}
              bg="#7770b3"
              onClick={(e) => {
                e.preventDefault();
                newContract();
              }}
            >
              Deploy
            </Button>
          </div>
        </Sider>
        <Content style={contentStyle}>
          <div className="existing-contracts">
            <h1> Existing Contracts </h1>

            <div id="container">
              {escrows.map((escrow) => {
                return <Escrow key={escrow.address} {...escrow} />;
              })}
            </div>
          </div>
        </Content>
      </Layout>
      <Footer style={footerStyle}>
        Impressum | ©{new Date().getFullYear()}{" "}
      </Footer>
    </Layout>
  );
}

export default App;

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { deploy, getEscrowContract } from "./deploy";
import Escrow from "./Escrow";
import { Cookies, useCookies } from "react-cookie";
import { Button } from "antd";
import { Layout, Flex, Typography } from "antd";

const { Header, Footer, Sider, Content } = Layout;

// local provider
const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

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
      // console.log("getAccounts - %s", accounts[0]);
      setAccount(accounts[0]);
      // const url = process.env.ALCHEMY_TESTNET_RPC_URL;
      // const provider = new ethers.providers.JsonRpcProvider(url);

      console.log("provider:  ", provider);
      setSigner(provider.getSigner());
    }

    async function getAppEscrowContract() {
      console.log("Debug %s", escrows.length);
      if (
        escrows.length === 0 &&
        signer &&
        cookies.escrow &&
        cookies.escrow.length !== 0 &&
        cookies.escrow !== undefined
      ) {
        console.log("getAppEscrowContract length: %s", cookies.escrow.length);
        console.log("getAppEscrowContract: %s", cookies.escrow);
        getEscrowContract(signer, cookies.escrow).then((escrow) => {
          console.log(
            "getAppEscrowContract - loaded from Cookie Address:  ",
            escrow
          );
          setEscrows([...escrow]);
          console.log(
            "getAppEscrowContract - loaded from Cookie Address:  ",
            escrows
          );
        });
      }
      setDeployLoading(false);
    }

    getAccounts();
    getAppEscrowContract();
  }, [account]);

  async function newContract() {
    setDeployLoading(true);
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.utils.parseUnits(
      document.getElementById("ether").value,
      "ether"
    );

    const escrowContract = await deploy(signer, arbiter, beneficiary, value)
      .then((tx) => {
        console.log("newContract - WORKS !!!", tx);
        return tx;
      })
      .catch((e) => {
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
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });
        await approve(escrowContract, signer);
      },
      approveLoading,
    };

    setEscrows([...escrows, escrow]);
    console.log("newContract - Escrows:  ", escrows);
    console.log("newContract - Escrow:  ", escrow);

    let cookieArray = [];
    if (cookies.escrow && cookies.escrow.length > 0) {
      console.log("newContract - cookieArray: %o", cookies.escrow);
      cookieArray = Array.from(cookies.escrow);
      cookieArray.push(escrow.address);
    } else {
      cookieArray.push(escrow.address);
      //cookieArray.push(cookies.escrow);
    }
    console.log("newContract before setCookie %o", cookieArray);
    setCookie("escrow", cookieArray);
    console.log("newContract - cookie: %o", cookies);
    if (cookies.escrow) {
      const cookieEscrow = cookies.escrow;
      console.log("newContract - contract end ", cookieEscrow);
    }
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

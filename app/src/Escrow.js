import { ethers } from "ethers";
import { useCookies } from "react-cookie";
import { useState } from "react";
import { Button } from "antd";

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  approveLoading,
}) {
  const [cookies] = useCookies(["escrow"]);

  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div> Address</div>
          <div> {address} </div>
        </li>
        <li>
          <div> Arbiter</div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary</div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value</div>
          <div>
            {" "}
            {value ? ethers.utils.formatUnits(value, "ether") : "0"} ETH
          </div>
        </li>
        <Button
          type="primary"
          id={address}
          loading={approveLoading}
          onClick={(e) => {
            e.preventDefault();
            handleApprove();
          }}
        >
          Approve
        </Button>
      </ul>
    </div>
  );
}

import {ethers} from "ethers";
import { useCookies } from 'react-cookie';

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
}) {
  const [cookies] = useCookies(['escrow']);
  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div> Address</div>
          <div> {cookies.escrow} </div>
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
          <div> {value ? ethers.utils.formatUnits(value, "ether") : '0'} ETH</div>
        </li>
        <div
            className="button"
            id={address}
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
        >
          Approve
        </div>
      </ul>
    </div>
  );
}

import { Utils, Wallet } from '@ijstech/eth-wallet';
import { ITokenObject } from './interface';
import { Contracts } from './contracts/oswap-openswap-contract/index';

const sendToken = async (token: ITokenObject, recipient: string, amount: string | number) => {
  const wallet = Wallet.getInstance();
  const value = Utils.toDecimals(amount, token.decimals);
  if (token.address) {
    const contract = new Contracts.OSWAP_ERC20(wallet, token.address);
    await contract.transfer({ to: recipient, value });
  } else {
    await wallet.send(recipient, value.toNumber())
  }
}

export {
  sendToken
}

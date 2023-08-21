import { Utils, Wallet } from '@ijstech/eth-wallet';
import { ITokenObject } from '@scom/scom-token-list';
import { Contracts } from '@scom/oswap-openswap-contract';

const sendToken = async (token: ITokenObject, recipient: string, amount: string | number, callback: (error: Error, receipt?: string) => void, confirmationCallBack: () => void) => {
  const wallet = Wallet.getClientInstance();
  try {
    if (token.address) {
      const value = Utils.toDecimals(amount, token.decimals);
      const contract = new Contracts.OSWAP_ERC20(wallet, token.address);
      await contract.transfer({ to: recipient, value });
    } else {
      const { transactionHash } = await wallet.send(recipient, Number(amount));
      callback(undefined, transactionHash);
      confirmationCallBack();
    }
  } catch (error) {
    callback(error);
  }
}

export {
  sendToken
}

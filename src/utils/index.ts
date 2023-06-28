import { BigNumber } from "@ijstech/eth-wallet";

export const formatNumber = (value: any, decimals?: number) => {
  let val = value;
  const minValue = '0.0000001';
  if (typeof value === 'string') {
    val = new BigNumber(value).toNumber();
  } else if (typeof value === 'object') {
    val = value.toNumber();
  }
  if (val != 0 && new BigNumber(val).lt(minValue)) {
    return `<${minValue}`;
  }
  return formatNumberWithSeparators(val, decimals || 4);
};

export const formatNumberWithSeparators = (value: number, precision?: number) => {
  if (!value) value = 0;
  if (precision) {
    let outputStr = '';
    if (value >= 1) {
      const unit = Math.pow(10, precision);
      const rounded = Math.floor(value * unit) / unit;
      outputStr = rounded.toLocaleString('en-US', { maximumFractionDigits: precision });
    }
    else {
      outputStr = value.toLocaleString('en-US', { maximumSignificantDigits: precision });
    }

    if (outputStr.length > 18) {
      outputStr = outputStr.substr(0, 18) + '...'
    }
    return outputStr;
  }
  else {
    return value.toLocaleString('en-US');
  }
}

export function parseContractError(oMessage: any): string {
  if (typeof oMessage === 'string') return oMessage;

  let message = '';
  if (oMessage.message && oMessage.message.includes('Internal JSON-RPC error.'))
    message = JSON.parse(oMessage.message.replace('Internal JSON-RPC error.\n', '')).message;
  else if (oMessage.message)
    message = oMessage.message;

  const staticMessageMap: { [key: string]: string } = {
    'execution reverted: OAXDEX: K': 'x * y = k Violated',
    'execution reverted: OAXDEX: FORBIDDEN': 'Forbidden',
    'execution reverted: OAXDEX: INSUFFICIENT_INPUT_AMOUNT': 'Insufficient input amount',
    'execution reverted: OAXDEX: INVALID_TO': 'Invalid to',
    'execution reverted: OAXDEX: INSUFFICIENT_OUTPUT_AMOUNT': 'Insufficient output amount',
    'execution reverted: OAXDEX: PAIR PAUSED': 'Pair paused',
    'execution reverted: OAXDEX: GLOBALLY PAUSED': 'Globally paused',
    'execution reverted: OAXDEX: OVERFLOW': 'Overflow',
    'execution reverted: OAXDEX_Pair: INSUFFICIENT_OUTPUT_AMOUNT': 'Insufficient output amount',
    'execution reverted: OAXDEX_Pair: INSUFFICIENT_INPUT_AMOUNT': 'Insufficient input amount',
    'execution reverted: OAXDEX: INVALID_SIGNATURE': 'Invalid signature',
    'execution reverted: OAXDEX: EXPIRED': 'Expired',
    'MetaMask Tx Signature: User denied transaction signature.': 'User denied transaction signature',
    'execution reverted: OracleAdaptor: Price outside allowed range': 'Circuit Breaker: Exceeds Price Protection Range',
    'execution reverted: No oracle found': 'No Oracle found',
    'execution reverted: Amount exceeds available fund': 'Insufficient liquidity',
  }

  return staticMessageMap[message] ?? `Unknown Error: ${message}`;
}

export function isWalletAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export {
  getERC20Amount,
  getTokenBalance,
  registerSendTxEvents
} from './token';

export {
  ApprovalStatus,
  getERC20Allowance,
  getERC20ApprovalModelAction,
  IERC20ApprovalOptions,
  IERC20ApprovalAction
} from './approvalModel';
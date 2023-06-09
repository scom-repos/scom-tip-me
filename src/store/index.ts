import { Wallet } from "@ijstech/eth-wallet";
import { IExtendedNetwork } from "../interface";

export const enum EventId {
  ConnectWallet = 'connectWallet',
  IsWalletConnected = 'isWalletConnected',
  IsWalletDisconnected = 'IsWalletDisconnected',
  chainChanged = 'chainChanged',
  Paid = 'Paid'
}

export enum WalletPlugin {
  MetaMask = 'metamask',
  WalletConnect = 'walletconnect',
}

export const getNetworkInfo = (chainId: number) => {
  return state.networkMap[chainId];
}

export const getSupportedNetworks = () => {
  return Object.values(state.networkMap);
}

export const state = {
  defaultChainId: 1,
  networkMap: {} as { [key: number]: IExtendedNetwork },
  ipfsGatewayUrl: 'https://ipfs.scom.dev/ipfs/'
}

export const setDataFromSCConfig = (options: any) => {
  if (options.ipfsGatewayUrl) {
    setIPFSGatewayUrl(options.ipfsGatewayUrl);
  }
}

export const setIPFSGatewayUrl = (url: string) => {
  state.ipfsGatewayUrl = url;
}

export const getIPFSGatewayUrl = () => {
  return state.ipfsGatewayUrl;
}

export const setDefaultChainId = (chainId: number) => {
  state.defaultChainId = chainId;
}

export const getDefaultChainId = () => {
  return state.defaultChainId;
}

export function isWalletConnected() {
  const wallet = Wallet.getClientInstance();
  return wallet.isConnected;
}

export const getChainId = () => {
  const wallet = Wallet.getInstance();
  return wallet?.chainId || getDefaultChainId();
}

export const getImageIpfsUrl = (url: string) => {
  if (url && url.startsWith("ipfs://"))
    return `${getIPFSGatewayUrl()}${url.substring(7)}`;
  return url;
}
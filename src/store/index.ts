import { INetwork, Wallet } from "@ijstech/eth-wallet";
import { application } from "@ijstech/components";

export const enum EventId {
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
  networkMap: {} as { [key: number]: INetwork },
  ipfsGatewayUrl: 'https://ipfs.scom.dev/ipfs/',
  rpcWalletId: ''
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

export const getImageIpfsUrl = (url: string) => {
  if (url && url.startsWith("ipfs://"))
    return `${getIPFSGatewayUrl()}${url.substring(7)}`;
  return url;
}

export function isClientWalletConnected() {
  const wallet = Wallet.getClientInstance();
  return wallet.isConnected;
}

export function isRpcWalletConnected() {
  const wallet = getRpcWallet();
  return wallet?.isConnected;
}

export function getChainId() {
  const rpcWallet = getRpcWallet();
  return rpcWallet?.chainId;
}

export function initRpcWallet(defaultChainId: number) {
  if (state.rpcWalletId) {
    return state.rpcWalletId;
  }
  const clientWallet = Wallet.getClientInstance();
  const networkList: INetwork[] = Object.values(application.store.networkMap);
  const instanceId = clientWallet.initRpcWallet({
    networks: networkList,
    defaultChainId,
    infuraId: application.store.infuraId,
    multicalls: application.store.multicalls
  });
  state.rpcWalletId = instanceId;
  if (clientWallet.address) {
    const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
    rpcWallet.address = clientWallet.address;
  }
  return instanceId;
}

export function getRpcWallet() {
  return Wallet.getRpcWalletInstance(state.rpcWalletId);
}

export function getClientWallet() {
  return Wallet.getClientInstance();
}
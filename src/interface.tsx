import { INetworkConfig } from "@scom/scom-network-picker";
import { ITokenObject } from "@scom/scom-token-list";
import { IWalletPlugin } from "@scom/scom-wallet-modal";

export interface ICustomToken extends ITokenObject {
  chainId: number;
}

export interface ITipMe {
  logo: string;
  description: string;
  tokens: ICustomToken[];
  recipient: string;
  defaultChainId: number;
  wallets: IWalletPlugin[];
  networks: INetworkConfig[];
  showHeader?: boolean;
}

export interface IEmbedData extends Partial<ITipMe> {
  logo?: string;
  description?: string;
  defaultChainId: number;
  wallets: IWalletPlugin[];
  networks: INetworkConfig[];
  showHeader?: boolean;
}

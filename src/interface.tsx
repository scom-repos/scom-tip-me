import { INetworkConfig } from "@scom/scom-network-picker";
import { ITokenObject } from "@scom/scom-token-list";
import { IWalletPlugin } from "@scom/scom-wallet-modal";

export interface ITipMe {
  logo: string;
  description: string;
  tokens: ITokenObject[];
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

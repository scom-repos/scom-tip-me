import { Module, customModule, Container, application } from '@ijstech/components';
import { getMulticallInfoList } from '@scom/scom-multicall';
import { INetwork } from '@ijstech/eth-wallet';
import getNetworkList from '@scom/scom-network-list';
import ScomTipMe from '@scom/scom-tip-me';
@customModule
export default class Module1 extends Module {
    private scomTipMe: ScomTipMe;

    constructor(parent?: Container, options?: any) {
        super(parent, options);
        const multicalls = getMulticallInfoList();
        const networkMap = this.getNetworkMap(options.infuraId);
        application.store = {
            infuraId: options.infuraId,
            multicalls,
            networkMap
        }
    }

    private getNetworkMap = (infuraId?: string) => {
        const networkMap = {};
        const defaultNetworkList: INetwork[] = getNetworkList();
        const defaultNetworkMap: Record<number, INetwork> = defaultNetworkList.reduce((acc, cur) => {
            acc[cur.chainId] = cur;
            return acc;
        }, {});
        for (const chainId in defaultNetworkMap) {
            const networkInfo = defaultNetworkMap[chainId];
            const explorerUrl = networkInfo.blockExplorerUrls && networkInfo.blockExplorerUrls.length ? networkInfo.blockExplorerUrls[0] : "";
            if (infuraId && networkInfo.rpcUrls && networkInfo.rpcUrls.length > 0) {
                for (let i = 0; i < networkInfo.rpcUrls.length; i++) {
                    networkInfo.rpcUrls[i] = networkInfo.rpcUrls[i].replace(/{INFURA_ID}/g, infuraId);
                }
            }
            networkMap[networkInfo.chainId] = {
                ...networkInfo,
                symbol: networkInfo.nativeCurrency?.symbol || "",
                explorerTxUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}tx/` : "",
                explorerAddressUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}address/` : ""
            }
        }
        return networkMap;
    }

    async init() {
        super.init();
    }

    render() {
        return <i-panel>
            <i-vstack id="mainStack" margin={{ top: '1rem', left: '1rem', right: '1rem', bottom: '1rem' }} gap="2rem">
                <i-scom-tip-me
                    logo="ipfs://bafkreicdwbtx5niyhfzctxvxnwxjt3qfb3kyotrdpkdo26wky33lnt7lci"
                    description="If you like this Board, support with a Tip"
                    recipient="0xA81961100920df22CF98703155029822f2F7f033"
                    tokens={[
                        {
                            "address": "0xDe9334C157968320f26e449331D6544b89bbD00F",
                            "chainId": 97
                        },
                        {
                            "address": "avax",
                            "chainId": 43113
                        },
                        {
                            "address": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
                            "chainId": 43113
                        },
                        {
                            "address": "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
                            "chainId": 43113
                        }
                    ]}
                    networks={[
                        {
                            "chainId": 97
                        },
                        {
                            "chainId": 43113
                        }
                    ]}
                    wallets={[
                        {
                            "name": "metamask"
                        }
                    ]}
                    defaultChainId={43113}
                />
            </i-vstack>
        </i-panel>
    }
}
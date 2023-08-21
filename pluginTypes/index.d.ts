/// <reference path="@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-token-input/@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-token-input/@scom/scom-token-modal/@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-dapp-container/@ijstech/eth-wallet/index.d.ts" />
/// <amd-module name="@scom/scom-tip-me/interface.tsx" />
declare module "@scom/scom-tip-me/interface.tsx" {
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
}
/// <amd-module name="@scom/scom-tip-me/utils/index.ts" />
declare module "@scom/scom-tip-me/utils/index.ts" {
    import { ISendTxEventsOptions } from "@ijstech/eth-wallet";
    export const registerSendTxEvents: (sendTxEventHandlers: ISendTxEventsOptions) => void;
}
/// <amd-module name="@scom/scom-tip-me/store/index.ts" />
declare module "@scom/scom-tip-me/store/index.ts" {
    export const enum EventId {
        Paid = "Paid"
    }
    export class State {
        ipfsGatewayUrl: string;
        rpcWalletId: string;
        constructor(options: any);
        private initData;
        initRpcWallet(defaultChainId: number): string;
        getRpcWallet(): import("@ijstech/eth-wallet").IRpcWallet;
        isRpcWalletConnected(): boolean;
        getChainId(): number;
    }
    export function isClientWalletConnected(): boolean;
}
/// <amd-module name="@scom/scom-tip-me/index.css.ts" />
declare module "@scom/scom-tip-me/index.css.ts" {
    export const dappContainerStyle: string;
    export const buttonStyle: string;
    export const tokenInputStyle: string;
}
/// <amd-module name="@scom/scom-tip-me/API.ts" />
declare module "@scom/scom-tip-me/API.ts" {
    import { ITokenObject } from '@scom/scom-token-list';
    const sendToken: (token: ITokenObject, recipient: string, amount: string | number, callback: (error: Error, receipt?: string) => void, confirmationCallBack: () => void) => Promise<void>;
    export { sendToken };
}
/// <amd-module name="@scom/scom-tip-me/data.json.ts" />
declare module "@scom/scom-tip-me/data.json.ts" {
    const _default: {
        ipfsGatewayUrl: string;
        defaultBuilderData: {
            logo: string;
            description: string;
            recipient: string;
            tokens: {
                address: string;
                chainId: number;
            }[];
            defaultChainId: number;
            networks: {
                chainId: number;
            }[];
            wallets: {
                name: string;
            }[];
            showHeader: boolean;
            showFooter: boolean;
        };
    };
    export default _default;
}
/// <amd-module name="@scom/scom-tip-me/formSchema.ts" />
declare module "@scom/scom-tip-me/formSchema.ts" {
    import ScomNetworkPicker from '@scom/scom-network-picker';
    import ScomTokenInput from '@scom/scom-token-input';
    const _default_1: {
        general: {
            dataSchema: {
                type: string;
                properties: {
                    logo: {
                        type: string;
                        format: string;
                        required: boolean;
                    };
                    description: {
                        type: string;
                        required: boolean;
                    };
                    recipient: {
                        type: string;
                        required: boolean;
                    };
                    tokens: {
                        type: string;
                        required: boolean;
                        items: {
                            type: string;
                            properties: {
                                chainId: {
                                    type: string;
                                    enum: number[];
                                    required: boolean;
                                };
                                address: {
                                    type: string;
                                    required: boolean;
                                };
                            };
                        };
                    };
                };
            };
            uiSchema: {
                type: string;
                elements: ({
                    type: string;
                    scope: string;
                    options?: undefined;
                } | {
                    type: string;
                    scope: string;
                    options: {
                        detail: {
                            type: string;
                        };
                    };
                })[];
            };
            customControls(rpcWalletId: string): {
                "#/properties/tokens/properties/chainId": {
                    render: () => ScomNetworkPicker;
                    getData: (control: ScomNetworkPicker) => number;
                    setData: (control: ScomNetworkPicker, value: number) => void;
                };
                "#/properties/tokens/properties/address": {
                    render: () => ScomTokenInput;
                    getData: (control: ScomTokenInput) => string;
                    setData: (control: ScomTokenInput, value: string) => void;
                };
            };
        };
        theme: {
            dataSchema: {
                type: string;
                properties: {
                    dark: {
                        type: string;
                        properties: {
                            backgroundColor: {
                                type: string;
                                format: string;
                            };
                            fontColor: {
                                type: string;
                                format: string;
                            };
                            inputBackgroundColor: {
                                type: string;
                                format: string;
                            };
                            inputFontColor: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                    light: {
                        type: string;
                        properties: {
                            backgroundColor: {
                                type: string;
                                format: string;
                            };
                            fontColor: {
                                type: string;
                                format: string;
                            };
                            inputBackgroundColor: {
                                type: string;
                                format: string;
                            };
                            inputFontColor: {
                                type: string;
                                format: string;
                            };
                        };
                    };
                };
            };
        };
    };
    export default _default_1;
}
/// <amd-module name="@scom/scom-tip-me" />
declare module "@scom/scom-tip-me" {
    import { Module, Container, ControlElement } from '@ijstech/components';
    import { ICustomToken, IEmbedData } from "@scom/scom-tip-me/interface.tsx";
    import { INetworkConfig } from '@scom/scom-network-picker';
    import { IWalletPlugin } from '@scom/scom-wallet-modal';
    interface ScomTipMeElement extends ControlElement {
        logo: string;
        description: string;
        tokens: {
            address: string;
            chainId: number;
        }[];
        recipient: string;
        defaultChainId: number;
        wallets: IWalletPlugin[];
        networks: INetworkConfig[];
        showHeader?: boolean;
        lazyLoad?: boolean;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['i-scom-tip-me']: ScomTipMeElement;
            }
        }
    }
    export default class ScomTipMe extends Module {
        private state;
        private imgLogo;
        private lbDescription;
        private tokenInput;
        private btnSend;
        private txStatusModal;
        private dappContainer;
        private mdWallet;
        private _data;
        private $eventBus;
        private tokenBalance;
        private tokenObj;
        tag: any;
        defaultEdit: boolean;
        private rpcWalletEvents;
        constructor(parent?: Container, options?: any);
        removeRpcWalletEvents(): void;
        onHide(): void;
        private onChainChanged;
        static create(options?: ScomTipMeElement, parent?: Container): Promise<ScomTipMe>;
        private get chainId();
        private get rpcWallet();
        get wallets(): IWalletPlugin[];
        set wallets(value: IWalletPlugin[]);
        get networks(): INetworkConfig[];
        set networks(value: INetworkConfig[]);
        get showHeader(): boolean;
        set showHeader(value: boolean);
        get defaultChainId(): number;
        set defaultChainId(value: number);
        get description(): string;
        set description(value: string);
        get logo(): string;
        set logo(value: string);
        get tokens(): ICustomToken[];
        set tokens(value: ICustomToken[]);
        private get tokenList();
        private _getActions;
        getConfigurators(): ({
            name: string;
            target: string;
            getActions: any;
            getData: any;
            setData: (data: IEmbedData) => Promise<void>;
            setTag: any;
            getTag: any;
            getLinkParams?: undefined;
            setLinkParams?: undefined;
        } | {
            name: string;
            target: string;
            getActions: any;
            getLinkParams: () => {
                data: string;
            };
            setLinkParams: (params: any) => Promise<void>;
            getData: any;
            setData: any;
            setTag: any;
            getTag: any;
        })[];
        private getData;
        private resetRpcWallet;
        private setData;
        private getTag;
        private updateTag;
        setTag(value: any): Promise<void>;
        private updateStyle;
        private updateTheme;
        private initializeWidgetConfig;
        private initWallet;
        private refreshTokenInfo;
        private updateTokenObject;
        private updateTokenInput;
        private updateBtn;
        private onSelectToken;
        private onInputAmountChanged;
        private onSetMaxBalance;
        private sendToken;
        init(): Promise<void>;
        render(): any;
    }
}

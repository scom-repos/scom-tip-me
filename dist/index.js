var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-tip-me/interface.tsx", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("@scom/scom-tip-me/utils/index.ts", ["require", "exports", "@ijstech/eth-wallet"], function (require, exports, eth_wallet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerSendTxEvents = void 0;
    const registerSendTxEvents = (sendTxEventHandlers) => {
        const wallet = eth_wallet_1.Wallet.getClientInstance();
        wallet.registerSendTxEvents({
            transactionHash: (error, receipt) => {
                if (sendTxEventHandlers.transactionHash) {
                    sendTxEventHandlers.transactionHash(error, receipt);
                }
            },
            confirmation: (receipt) => {
                if (sendTxEventHandlers.confirmation) {
                    sendTxEventHandlers.confirmation(receipt);
                }
            },
        });
    };
    exports.registerSendTxEvents = registerSendTxEvents;
});
define("@scom/scom-tip-me/store/index.ts", ["require", "exports", "@ijstech/eth-wallet", "@ijstech/components"], function (require, exports, eth_wallet_2, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isClientWalletConnected = exports.State = void 0;
    class State {
        constructor(options) {
            this.ipfsGatewayUrl = '';
            this.rpcWalletId = '';
            this.initData(options);
        }
        initData(options) {
            if (options.ipfsGatewayUrl) {
                this.ipfsGatewayUrl = options.ipfsGatewayUrl;
            }
        }
        initRpcWallet(defaultChainId) {
            var _a, _b, _c;
            if (this.rpcWalletId) {
                return this.rpcWalletId;
            }
            const clientWallet = eth_wallet_2.Wallet.getClientInstance();
            const networkList = Object.values(((_a = components_1.application.store) === null || _a === void 0 ? void 0 : _a.networkMap) || []);
            const instanceId = clientWallet.initRpcWallet({
                networks: networkList,
                defaultChainId,
                infuraId: (_b = components_1.application.store) === null || _b === void 0 ? void 0 : _b.infuraId,
                multicalls: (_c = components_1.application.store) === null || _c === void 0 ? void 0 : _c.multicalls
            });
            this.rpcWalletId = instanceId;
            if (clientWallet.address) {
                const rpcWallet = eth_wallet_2.Wallet.getRpcWalletInstance(instanceId);
                rpcWallet.address = clientWallet.address;
            }
            return instanceId;
        }
        getRpcWallet() {
            return this.rpcWalletId ? eth_wallet_2.Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
        }
        isRpcWalletConnected() {
            const wallet = this.getRpcWallet();
            return wallet === null || wallet === void 0 ? void 0 : wallet.isConnected;
        }
        getChainId() {
            const rpcWallet = this.getRpcWallet();
            return rpcWallet === null || rpcWallet === void 0 ? void 0 : rpcWallet.chainId;
        }
    }
    exports.State = State;
    function isClientWalletConnected() {
        const wallet = eth_wallet_2.Wallet.getClientInstance();
        return wallet.isConnected;
    }
    exports.isClientWalletConnected = isClientWalletConnected;
});
define("@scom/scom-tip-me/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.tokenInputStyle = exports.buttonStyle = exports.dappContainerStyle = void 0;
    const Theme = components_2.Styles.Theme.ThemeVars;
    exports.dappContainerStyle = components_2.Styles.style({
        $nest: {
            '& > i-vstack > i-panel': {
                overflow: 'visible'
            },
            'dapp-container-body': {
                overflow: 'inherit'
            }
        }
    });
    exports.buttonStyle = components_2.Styles.style({
        $nest: {
            '&.disabled': {
                background: Theme.colors.primary.main
            },
            'i-icon svg': {
                fill: Theme.colors.primary.contrastText
            }
        }
    });
    exports.tokenInputStyle = components_2.Styles.style({
        $nest: {
            '#gridTokenInput': {
                borderRadius: 16,
                paddingBlock: '8px !important'
            },
            '#btnToken': {
                minWidth: 120
            }
        }
    });
});
define("@scom/scom-tip-me/API.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/oswap-openswap-contract"], function (require, exports, eth_wallet_3, oswap_openswap_contract_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendToken = void 0;
    const sendToken = async (token, recipient, amount, callback, confirmationCallBack) => {
        const wallet = eth_wallet_3.Wallet.getClientInstance();
        try {
            if (token.address) {
                const value = eth_wallet_3.Utils.toDecimals(amount, token.decimals);
                const contract = new oswap_openswap_contract_1.Contracts.OSWAP_ERC20(wallet, token.address);
                await contract.transfer({ to: recipient, value });
            }
            else {
                const { transactionHash } = await wallet.send(recipient, Number(amount));
                callback(undefined, transactionHash);
                confirmationCallBack();
            }
        }
        catch (error) {
            callback(error);
        }
    };
    exports.sendToken = sendToken;
});
define("@scom/scom-tip-me/data.json.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-tip-me/data.json.ts'/> 
    exports.default = {
        "ipfsGatewayUrl": "https://ipfs.scom.dev/ipfs/",
        "defaultBuilderData": {
            "logo": "ipfs://bafkreicdwbtx5niyhfzctxvxnwxjt3qfb3kyotrdpkdo26wky33lnt7lci",
            "description": "If you like this Board, support with a Tip",
            "recipient": "0xA81961100920df22CF98703155029822f2F7f033",
            "tokens": [
                {
                    "address": "0x29386B60e0A9A1a30e1488ADA47256577ca2C385",
                    "chainId": 97
                },
                {
                    "address": "0x45eee762aaeA4e5ce317471BDa8782724972Ee19",
                    "chainId": 97
                },
                {
                    "address": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
                    "chainId": 43113
                },
                {
                    "address": "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
                    "chainId": 43113
                }
            ],
            "defaultChainId": 43113,
            "networks": [
                {
                    "chainId": 43113
                },
                {
                    "chainId": 97
                }
            ],
            "wallets": [
                {
                    "name": "metamask"
                }
            ],
            "showHeader": true,
            "showFooter": true
        }
    };
});
define("@scom/scom-tip-me/formSchema.ts", ["require", "exports", "@scom/scom-network-picker", "@scom/scom-token-input"], function (require, exports, scom_network_picker_1, scom_token_input_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chainIds = [1, 56, 137, 250, 97, 80001, 43113, 43114];
    const networks = chainIds.map(v => { return { chainId: v }; });
    exports.default = {
        general: {
            dataSchema: {
                type: 'object',
                properties: {
                    logo: {
                        type: 'string',
                        format: 'data-url',
                        required: true
                    },
                    description: {
                        type: 'string',
                        required: true
                    },
                    recipient: {
                        type: 'string',
                        required: true
                    },
                    tokens: {
                        type: 'array',
                        required: true,
                        items: {
                            type: 'object',
                            properties: {
                                chainId: {
                                    type: 'number',
                                    enum: chainIds,
                                    required: true
                                },
                                address: {
                                    type: 'string',
                                    required: true
                                }
                            }
                        }
                    }
                }
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements: [
                    {
                        type: 'Control',
                        scope: '#/properties/logo'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/description'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/recipient'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/tokens',
                        options: {
                            detail: {
                                type: 'VerticalLayout'
                            }
                        }
                    }
                ]
            },
            customControls(rpcWalletId) {
                let networkPickers = [];
                let tokenInputs = [];
                return {
                    "#/properties/tokens/properties/chainId": {
                        render: () => {
                            const idx = networkPickers.length;
                            networkPickers[idx] = new scom_network_picker_1.default(undefined, {
                                type: 'combobox',
                                networks,
                                onCustomNetworkSelected: () => {
                                    var _a;
                                    const chainId = (_a = networkPickers[idx].selectedNetwork) === null || _a === void 0 ? void 0 : _a.chainId;
                                    tokenInputs[idx].targetChainId = chainId;
                                }
                            });
                            return networkPickers[idx];
                        },
                        getData: (control) => {
                            var _a;
                            return (_a = control.selectedNetwork) === null || _a === void 0 ? void 0 : _a.chainId;
                        },
                        setData: (control, value) => {
                            control.setNetworkByChainId(value);
                            const idx = networkPickers.findIndex(f => f === control);
                            if (tokenInputs[idx])
                                tokenInputs[idx].targetChainId = value;
                        }
                    },
                    "#/properties/tokens/properties/address": {
                        render: () => {
                            var _a, _b;
                            const idx = tokenInputs.length;
                            tokenInputs[idx] = new scom_token_input_1.default(undefined, {
                                type: 'combobox',
                                isBalanceShown: false,
                                isBtnMaxShown: false,
                                isInputShown: false
                            });
                            tokenInputs[idx].rpcWalletId = rpcWalletId;
                            const chainId = (_b = (_a = networkPickers[idx]) === null || _a === void 0 ? void 0 : _a.selectedNetwork) === null || _b === void 0 ? void 0 : _b.chainId;
                            if (chainId && tokenInputs[idx].targetChainId !== chainId) {
                                tokenInputs[idx].targetChainId = chainId;
                            }
                            return tokenInputs[idx];
                        },
                        getData: (control) => {
                            var _a, _b;
                            return ((_a = control.token) === null || _a === void 0 ? void 0 : _a.address) || ((_b = control.token) === null || _b === void 0 ? void 0 : _b.symbol);
                        },
                        setData: (control, value) => {
                            control.address = value;
                        }
                    }
                };
            }
        },
        theme: {
            dataSchema: {
                type: 'object',
                properties: {
                    "dark": {
                        type: 'object',
                        properties: {
                            backgroundColor: {
                                type: 'string',
                                format: 'color'
                            },
                            fontColor: {
                                type: 'string',
                                format: 'color'
                            },
                            inputBackgroundColor: {
                                type: 'string',
                                format: 'color'
                            },
                            inputFontColor: {
                                type: 'string',
                                format: 'color'
                            }
                        }
                    },
                    "light": {
                        type: 'object',
                        properties: {
                            backgroundColor: {
                                type: 'string',
                                format: 'color'
                            },
                            fontColor: {
                                type: 'string',
                                format: 'color'
                            },
                            inputBackgroundColor: {
                                type: 'string',
                                format: 'color'
                            },
                            inputFontColor: {
                                type: 'string',
                                format: 'color'
                            }
                        }
                    }
                }
            }
        }
    };
});
define("@scom/scom-tip-me", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-tip-me/utils/index.ts", "@scom/scom-tip-me/store/index.ts", "@scom/scom-token-list", "@scom/scom-tip-me/index.css.ts", "@scom/scom-tip-me/API.ts", "@scom/scom-tip-me/data.json.ts", "@scom/scom-tip-me/formSchema.ts"], function (require, exports, components_3, eth_wallet_4, index_1, index_2, scom_token_list_1, index_css_1, API_1, data_json_1, formSchema_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_3.Styles.Theme.ThemeVars;
    let ScomTipMe = class ScomTipMe extends components_3.Module {
        constructor(parent, options) {
            super(parent, options);
            this._data = {
                wallets: [],
                networks: [],
                defaultChainId: 0
            };
            this.tokenBalance = new eth_wallet_4.BigNumber(0);
            this.tag = {};
            this.defaultEdit = true;
            this.rpcWalletEvents = [];
            this.onChainChanged = async () => {
                this.refreshTokenInfo();
            };
            this.initializeWidgetConfig = async () => {
                if (!this.imgLogo.isConnected)
                    await this.imgLogo.ready();
                if (!this.lbDescription.isConnected)
                    await this.lbDescription.ready();
                if (!this.tokenInput.isConnected)
                    await this.tokenInput.ready();
                this.imgLogo.url = this.logo;
                this.lbDescription.caption = this.description;
                this.refreshTokenInfo();
            };
            this.initWallet = async () => {
                try {
                    await eth_wallet_4.Wallet.getClientInstance().init();
                    await this.rpcWallet.init();
                }
                catch (err) {
                    console.log(err);
                }
            };
            this.refreshTokenInfo = async () => {
                if (!this.tokenInput.isConnected)
                    await this.tokenInput.ready();
                const rpcWallet = this.rpcWallet;
                const { instanceId, address } = rpcWallet;
                scom_token_list_1.tokenStore.updateTokenMapData(this.chainId);
                if (address) {
                    await scom_token_list_1.tokenStore.updateAllTokenBalances(rpcWallet);
                }
                if (instanceId && instanceId !== this.tokenInput.rpcWalletId) {
                    this.tokenInput.rpcWalletId = instanceId;
                }
                await this.initWallet();
                this.updateTokenObject();
                this.updateTokenInput();
            };
            this.updateTokenObject = () => {
                const chainId = this.chainId;
                const tokensByChainId = this.tokenList.filter(f => f.chainId === chainId);
                this.tokenInput.tokenDataListProp = tokensByChainId;
                this.tokenObj = tokensByChainId[0];
                this.tokenInput.token = this.tokenObj ? Object.assign({}, this.tokenObj) : undefined;
                this.tokenInput.tokenReadOnly = tokensByChainId.length <= 1;
            };
            this.updateTokenInput = async () => {
                var _a;
                this.tokenBalance = ((_a = this.tokenObj) === null || _a === void 0 ? void 0 : _a.chainId) === this.chainId ? new eth_wallet_4.BigNumber(scom_token_list_1.tokenStore.getTokenBalance(this.tokenObj)) : new eth_wallet_4.BigNumber(0);
                this.updateBtn();
            };
            this.updateBtn = async () => {
                const isClientConnected = (0, index_2.isClientWalletConnected)();
                const isRpcConnected = this.state.isRpcWalletConnected();
                if (!this.btnSend.isConnected)
                    await this.btnSend.ready();
                if (!isClientConnected || !isRpcConnected) {
                    this.btnSend.caption = !isClientConnected ? 'Connect Wallet' : 'Switch Network';
                    this.btnSend.enabled = true;
                    return;
                }
                const amount = Number(this.tokenInput.amount);
                if (isNaN(amount) || amount <= 0) {
                    this.btnSend.caption = 'Input Amount';
                    this.btnSend.enabled = false;
                    return;
                }
                if (this.tokenBalance.lt(this.tokenInput.amount)) {
                    this.btnSend.caption = 'Insufficient Balance';
                    this.btnSend.enabled = false;
                    return;
                }
                this.btnSend.caption = 'Send';
                this.btnSend.enabled = true;
            };
            this.onSelectToken = (token) => {
                this.tokenObj = token;
                this.updateTokenInput();
            };
            this.onInputAmountChanged = () => {
                this.updateBtn();
            };
            this.onSetMaxBalance = () => {
                this.updateBtn();
            };
            this.sendToken = async () => {
                if (!(0, index_2.isClientWalletConnected)()) {
                    if (this.mdWallet) {
                        await components_3.application.loadPackage('@scom/scom-wallet-modal', '*');
                        this.mdWallet.networks = this.networks;
                        this.mdWallet.wallets = this.wallets;
                        this.mdWallet.showModal();
                    }
                    return;
                }
                if (!this.state.isRpcWalletConnected()) {
                    const clientWallet = eth_wallet_4.Wallet.getClientInstance();
                    await clientWallet.switchNetwork(this.chainId);
                    return;
                }
                if (!this.tokenObj || !this._data.recipient)
                    return;
                this.txStatusModal.message = {
                    status: 'warning',
                    content: 'Sending...'
                };
                this.txStatusModal.showModal();
                const callBack = (error, receipt) => {
                    if (error) {
                        this.txStatusModal.message = {
                            status: 'error',
                            content: error
                        };
                    }
                    else {
                        this.txStatusModal.message = {
                            status: 'success',
                            content: receipt
                        };
                        this.tokenInput.readOnly = true;
                        this.btnSend.enabled = false;
                        this.btnSend.caption = 'Sending';
                        this.btnSend.rightIcon.visible = true;
                    }
                    this.txStatusModal.showModal();
                };
                const confirmationCallBack = async () => {
                    this.updateTokenInput();
                    this.$eventBus.dispatch("Paid" /* EventId.Paid */);
                    this.tokenInput.readOnly = false;
                    this.btnSend.rightIcon.visible = false;
                };
                (0, index_1.registerSendTxEvents)({
                    transactionHash: callBack,
                    confirmation: confirmationCallBack
                });
                (0, API_1.sendToken)(this.tokenObj, this._data.recipient, this.tokenInput.amount, callBack, confirmationCallBack);
            };
            this.state = new index_2.State(data_json_1.default);
            this.$eventBus = components_3.application.EventBus;
        }
        removeRpcWalletEvents() {
            const rpcWallet = this.rpcWallet;
            for (let event of this.rpcWalletEvents) {
                rpcWallet.unregisterWalletEvent(event);
            }
            this.rpcWalletEvents = [];
        }
        onHide() {
            this.dappContainer.onHide();
            this.removeRpcWalletEvents();
        }
        static async create(options, parent) {
            let self = new this(parent, options);
            await self.ready();
            return self;
        }
        get chainId() {
            return this.state.getChainId();
        }
        get rpcWallet() {
            return this.state.getRpcWallet();
        }
        get wallets() {
            var _a;
            return (_a = this._data.wallets) !== null && _a !== void 0 ? _a : [];
        }
        set wallets(value) {
            this._data.wallets = value;
        }
        get networks() {
            var _a;
            return (_a = this._data.networks) !== null && _a !== void 0 ? _a : [];
        }
        set networks(value) {
            this._data.networks = value;
        }
        get showHeader() {
            var _a;
            return (_a = this._data.showHeader) !== null && _a !== void 0 ? _a : true;
        }
        set showHeader(value) {
            this._data.showHeader = value;
        }
        get defaultChainId() {
            return this._data.defaultChainId;
        }
        set defaultChainId(value) {
            this._data.defaultChainId = value;
        }
        get description() {
            var _a;
            return (_a = this._data.description) !== null && _a !== void 0 ? _a : '';
        }
        set description(value) {
            this._data.description = value;
        }
        get logo() {
            var _a, _b;
            if ((_a = this._data.logo) === null || _a === void 0 ? void 0 : _a.startsWith('ipfs://')) {
                return this._data.logo.replace('ipfs://', this.state.ipfsGatewayUrl);
            }
            return (_b = this._data.logo) !== null && _b !== void 0 ? _b : '';
        }
        set logo(value) {
            this._data.logo = value;
        }
        get tokens() {
            var _a;
            return (_a = this._data.tokens) !== null && _a !== void 0 ? _a : [];
        }
        set tokens(value) {
            this._data.tokens = value;
        }
        get tokenList() {
            var _a, _b;
            if (!this.tokens)
                return [];
            let list = [];
            for (const inputToken of this.tokens) {
                const tokenAddress = (_a = inputToken.address) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                const nativeToken = scom_token_list_1.ChainNativeTokenByChainId[inputToken.chainId];
                if (!tokenAddress || tokenAddress === ((_b = nativeToken === null || nativeToken === void 0 ? void 0 : nativeToken.symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase())) {
                    if (nativeToken)
                        list.push(Object.assign(Object.assign({}, nativeToken), { chainId: inputToken.chainId }));
                }
                else {
                    const tokens = scom_token_list_1.DefaultERC20Tokens[inputToken.chainId];
                    const token = tokens.find(v => { var _a; return ((_a = v.address) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === tokenAddress; });
                    if (token)
                        list.push(Object.assign(Object.assign({}, token), { chainId: inputToken.chainId }));
                }
            }
            return list;
        }
        _getActions() {
            var _a;
            const actions = [
                {
                    name: 'Settings',
                    icon: 'cog',
                    command: (builder, userInputData) => {
                        let _oldData = {
                            wallets: [],
                            networks: [],
                            defaultChainId: 0
                        };
                        return {
                            execute: async () => {
                                _oldData = Object.assign({}, this._data);
                                if (userInputData.logo != undefined)
                                    this._data.logo = userInputData.logo;
                                if (userInputData.description != undefined)
                                    this._data.description = userInputData.description;
                                if (userInputData.recipient != undefined)
                                    this._data.recipient = userInputData.recipient;
                                this._data.tokens = userInputData.tokens || [];
                                await this.resetRpcWallet();
                                this.initializeWidgetConfig();
                                if (builder === null || builder === void 0 ? void 0 : builder.setData)
                                    builder.setData(this._data);
                            },
                            undo: async () => {
                                this._data = Object.assign({}, _oldData);
                                this.initializeWidgetConfig();
                                if (builder === null || builder === void 0 ? void 0 : builder.setData)
                                    builder.setData(this._data);
                            },
                            redo: () => { }
                        };
                    },
                    userInputDataSchema: formSchema_1.default.general.dataSchema,
                    userInputUISchema: formSchema_1.default.general.uiSchema,
                    customControls: formSchema_1.default.general.customControls((_a = this.rpcWallet) === null || _a === void 0 ? void 0 : _a.instanceId)
                },
                {
                    name: 'Theme Settings',
                    icon: 'palette',
                    command: (builder, userInputData) => {
                        let oldTag = {};
                        return {
                            execute: async () => {
                                if (!userInputData)
                                    return;
                                oldTag = JSON.parse(JSON.stringify(this.tag));
                                if (builder)
                                    builder.setTag(userInputData);
                                else
                                    this.setTag(userInputData);
                                if (this.dappContainer)
                                    this.dappContainer.setTag(userInputData);
                            },
                            undo: () => {
                                if (!userInputData)
                                    return;
                                this.tag = JSON.parse(JSON.stringify(oldTag));
                                if (builder)
                                    builder.setTag(this.tag);
                                else
                                    this.setTag(this.tag);
                                if (this.dappContainer)
                                    this.dappContainer.setTag(this.tag);
                            },
                            redo: () => { }
                        };
                    },
                    userInputDataSchema: formSchema_1.default.theme.dataSchema
                }
            ];
            return actions;
        }
        getConfigurators() {
            let self = this;
            return [
                {
                    name: 'Builder Configurator',
                    target: 'Builders',
                    getActions: this._getActions.bind(this),
                    getData: this.getData.bind(this),
                    setData: async (data) => {
                        const defaultData = data_json_1.default.defaultBuilderData;
                        await this.setData(Object.assign(Object.assign({}, defaultData), data));
                    },
                    setTag: this.setTag.bind(this),
                    getTag: this.getTag.bind(this)
                },
                {
                    name: 'Emdedder Configurator',
                    target: 'Embedders',
                    getActions: this._getActions.bind(this),
                    getLinkParams: () => {
                        const data = this._data || {};
                        return {
                            data: window.btoa(JSON.stringify(data))
                        };
                    },
                    setLinkParams: async (params) => {
                        if (params.data) {
                            const utf8String = decodeURIComponent(params.data);
                            const decodedString = window.atob(utf8String);
                            const newData = JSON.parse(decodedString);
                            let resultingData = Object.assign(Object.assign({}, self._data), newData);
                            await self.setData(resultingData);
                        }
                    },
                    getData: this.getData.bind(this),
                    setData: this.setData.bind(this),
                    setTag: this.setTag.bind(this),
                    getTag: this.getTag.bind(this)
                }
            ];
        }
        getData() {
            return this._data;
        }
        async resetRpcWallet() {
            var _a;
            this.removeRpcWalletEvents();
            const rpcWalletId = await this.state.initRpcWallet(this.defaultChainId);
            const rpcWallet = this.rpcWallet;
            const chainChangedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_4.Constants.RpcWalletEvent.ChainChanged, async (chainId) => {
                this.onChainChanged();
            });
            const connectedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_4.Constants.RpcWalletEvent.Connected, async (connected) => {
                this.refreshTokenInfo();
            });
            this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);
            const data = {
                defaultChainId: this.defaultChainId,
                wallets: this.wallets,
                networks: this.networks,
                showHeader: this.showHeader,
                rpcWalletId: rpcWallet.instanceId || ''
            };
            if ((_a = this.dappContainer) === null || _a === void 0 ? void 0 : _a.setData)
                this.dappContainer.setData(data);
        }
        async setData(data) {
            this._data = data;
            await this.resetRpcWallet();
            await this.initializeWidgetConfig();
        }
        getTag() {
            return this.tag;
        }
        updateTag(type, value) {
            var _a;
            this.tag[type] = (_a = this.tag[type]) !== null && _a !== void 0 ? _a : {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.tag[type][prop] = value[prop];
            }
        }
        async setTag(value) {
            const newValue = value || {};
            for (let prop in newValue) {
                if (newValue.hasOwnProperty(prop)) {
                    if (prop === 'light' || prop === 'dark')
                        this.updateTag(prop, newValue[prop]);
                    else
                        this.tag[prop] = newValue[prop];
                }
            }
            if (this.dappContainer)
                this.dappContainer.setTag(this.tag);
            this.updateTheme();
        }
        updateStyle(name, value) {
            value ?
                this.style.setProperty(name, value) :
                this.style.removeProperty(name);
        }
        updateTheme() {
            var _a, _b, _c, _d, _e, _f;
            const themeVar = ((_a = this.dappContainer) === null || _a === void 0 ? void 0 : _a.theme) || 'light';
            this.updateStyle('--text-primary', (_b = this.tag[themeVar]) === null || _b === void 0 ? void 0 : _b.fontColor);
            this.updateStyle('--background-main', (_c = this.tag[themeVar]) === null || _c === void 0 ? void 0 : _c.backgroundColor);
            this.updateStyle('--input-font_color', (_d = this.tag[themeVar]) === null || _d === void 0 ? void 0 : _d.inputFontColor);
            this.updateStyle('--input-background', (_e = this.tag[themeVar]) === null || _e === void 0 ? void 0 : _e.inputBackgroundColor);
            this.updateStyle('--colors-primary-main', (_f = this.tag[themeVar]) === null || _f === void 0 ? void 0 : _f.buttonBackgroundColor);
        }
        async init() {
            this.isReadyCallbackQueued = true;
            super.init();
            const lazyLoad = this.getAttribute('lazyLoad', true, false);
            if (!lazyLoad) {
                const description = this.getAttribute('description', true);
                const logo = this.getAttribute('logo', true);
                const recipient = this.getAttribute('recipient', true);
                const tokens = this.getAttribute('tokens', true, []);
                const networks = this.getAttribute('networks', true, []);
                const wallets = this.getAttribute('wallets', true, []);
                const showHeader = this.getAttribute('showHeader', true);
                const defaultChainId = this.getAttribute('defaultChainId', true);
                await this.setData({
                    logo,
                    description,
                    recipient,
                    tokens,
                    networks,
                    wallets,
                    showHeader,
                    defaultChainId
                });
            }
            this.isReadyCallbackQueued = false;
            this.executeReadyCallback();
        }
        render() {
            return (this.$render("i-scom-dapp-container", { id: "dappContainer", class: index_css_1.dappContainerStyle },
                this.$render("i-panel", { background: { color: Theme.background.main }, padding: { top: 10, bottom: 10, left: 10, right: 10 } },
                    this.$render("i-vstack", { gap: 10, verticalAlignment: "center", horizontalAlignment: "center" },
                        this.$render("i-image", { id: "imgLogo", width: 100, height: 100 }),
                        this.$render("i-label", { id: "lbDescription", font: { bold: true, size: '24px' }, class: "text-center" }),
                        this.$render("i-scom-token-input", { id: "tokenInput", class: index_css_1.tokenInputStyle, onInputAmountChanged: this.onInputAmountChanged, onSetMaxBalance: this.onSetMaxBalance, onSelectToken: (token) => this.onSelectToken(token) }),
                        this.$render("i-button", { id: "btnSend", caption: "Send", class: index_css_1.buttonStyle, width: 200, maxWidth: "100%", padding: { top: '0.5rem', bottom: '0.5rem', left: '1rem', right: '1rem' }, font: { size: '1rem', color: Theme.colors.primary.contrastText }, rightIcon: { visible: false, spin: true, fill: Theme.colors.primary.contrastText }, onClick: this.sendToken })),
                    this.$render("i-scom-tx-status-modal", { id: "txStatusModal" }),
                    this.$render("i-scom-wallet-modal", { id: "mdWallet", wallets: [] }))));
        }
    };
    ScomTipMe = __decorate([
        (0, components_3.customElements)('i-scom-tip-me')
    ], ScomTipMe);
    exports.default = ScomTipMe;
});

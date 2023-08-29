import {
  Module,
  customElements,
  Image,
  Label,
  Styles,
  Button,
  Container,
  IEventBus,
  application,
  ControlElement
} from '@ijstech/components';
import { BigNumber, Constants, IEventBusRegistry, Wallet } from '@ijstech/eth-wallet';
import { IEmbedData } from './interface';
import { registerSendTxEvents } from './utils/index';
import { EventId, isClientWalletConnected, State } from './store/index';
import { ChainNativeTokenByChainId, DefaultERC20Tokens, ITokenObject, tokenStore } from '@scom/scom-token-list';
import { buttonStyle, dappContainerStyle, tokenInputStyle } from './index.css';
import { sendToken } from './API';
import configData from './data.json';
import formSchema from './formSchema';
import { INetworkConfig } from '@scom/scom-network-picker';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomTokenInput from '@scom/scom-token-input';
import ScomWalletModal, { IWalletPlugin } from '@scom/scom-wallet-modal';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';

const Theme = Styles.Theme.ThemeVars;

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['i-scom-tip-me']: ScomTipMeElement;
    }
  }
}

@customElements('i-scom-tip-me')
export default class ScomTipMe extends Module {
  private state: State;
  private imgLogo: Image;
  private lbDescription: Label;
  private tokenInput: ScomTokenInput;
  private btnSend: Button;
  private txStatusModal: ScomTxStatusModal;
  private dappContainer: ScomDappContainer;
  private mdWallet: ScomWalletModal;

  private _data: IEmbedData = {
    wallets: [],
    networks: [],
    defaultChainId: 0
  };
  private $eventBus: IEventBus;
  private tokenBalance = new BigNumber(0);
  private tokenObj: ITokenObject;

  tag: any = {}
  defaultEdit: boolean = true;
  private rpcWalletEvents: IEventBusRegistry[] = [];

  constructor(parent?: Container, options?: ScomTipMeElement) {
    super(parent, options);
    this.state = new State(configData);
    this.$eventBus = application.EventBus;
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

  private onChainChanged = async () => {
    this.refreshTokenInfo();
  }

  static async create(options?: ScomTipMeElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
  }

  private get chainId() {
    return this.state.getChainId();
  }

  private get rpcWallet() {
    return this.state.getRpcWallet();
  }

  get wallets() {
    return this._data.wallets ?? [];
  }
  set wallets(value: IWalletPlugin[]) {
    this._data.wallets = value;
  }

  get networks() {
    return this._data.networks ?? [];
  }
  set networks(value: INetworkConfig[]) {
    this._data.networks = value;
  }

  get showHeader() {
    return this._data.showHeader ?? true;
  }
  set showHeader(value: boolean) {
    this._data.showHeader = value;
  }

  get defaultChainId() {
    return this._data.defaultChainId;
  }
  set defaultChainId(value: number) {
    this._data.defaultChainId = value;
  }

  get description() {
    return this._data.description ?? '';
  }
  set description(value: string) {
    this._data.description = value;
  }

  get logo() {
    if (this._data.logo?.startsWith('ipfs://')) {
      return this._data.logo.replace('ipfs://', this.state.ipfsGatewayUrl);
    }
    return this._data.logo ?? '';
  }
  set logo(value: string) {
    this._data.logo = value;
  }

  get tokens() {
    return this._data.tokens ?? [];
  }
  set tokens(value: ITokenObject[]) {
    this._data.tokens = value;
  }

  private get tokenList() {
    if (!this.tokens) return [];
    let list: ITokenObject[] = [];
    for (const inputToken of this.tokens) {
      const tokenAddress = inputToken.address?.toLowerCase();
      const nativeToken = ChainNativeTokenByChainId[inputToken.chainId];
      if (!tokenAddress || tokenAddress === nativeToken?.symbol?.toLowerCase()) {
        if (nativeToken) list.push({ ...nativeToken, chainId: inputToken.chainId });
      } else {
        const tokens = DefaultERC20Tokens[inputToken.chainId];
        const token = tokens.find(v => v.address?.toLowerCase() === tokenAddress);
        if (token) list.push({ ...token, chainId: inputToken.chainId });
      }
    }
    return list;
  }

  private _getActions() {
    const actions = [
      {
        name: 'Edit',
        icon: 'edit',
        command: (builder: any, userInputData: any) => {
          let oldData: IEmbedData = {
            wallets: [],
            networks: [],
            defaultChainId: 0
          };
          let oldTag = {};
          return {
            execute: async () => {
              oldData = JSON.parse(JSON.stringify(this._data));
              const {
                logo,
                description,
                recipient,
                tokens,
                ...themeSettings
              } = userInputData;

              const generalSettings = {
                logo,
                description,
                recipient,
                tokens
              };
              if (generalSettings.logo != undefined) this._data.logo = generalSettings.logo;
              if (generalSettings.description != undefined) this._data.description = generalSettings.description;
              if (generalSettings.recipient != undefined) this._data.recipient = generalSettings.recipient;
              this._data.tokens = [];
              if (generalSettings.tokens) {
                for (let inputToken of generalSettings.tokens) {
                  const tokenAddress = inputToken.address?.toLowerCase();
                  const nativeToken = ChainNativeTokenByChainId[inputToken.chainId];
                  if (!tokenAddress || tokenAddress === nativeToken?.symbol?.toLowerCase()) {
                    if (nativeToken) this._data.tokens.push({ ...nativeToken, chainId: inputToken.chainId });
                  }
                  else {
                    const tokens = DefaultERC20Tokens[inputToken.chainId]
                    const token = tokens.find(v => v.address === inputToken.address);
                    if (token) this._data.tokens.push({ ...token, chainId: inputToken.chainId });
                  }
                }
              }
              await this.resetRpcWallet();
              this.initializeWidgetConfig();
              if (builder?.setData) builder.setData(this._data);

              oldTag = JSON.parse(JSON.stringify(this.tag));
              if (builder?.setTag) builder.setTag(themeSettings);
              else this.setTag(themeSettings);
              if (this.dappContainer) this.dappContainer.setTag(themeSettings);
            },
            undo: async () => {
              this._data = JSON.parse(JSON.stringify(oldData));
              this.initializeWidgetConfig();
              if (builder?.setData) builder.setData(this._data);

              this.tag = JSON.parse(JSON.stringify(oldTag));
              if (builder?.setTag) builder.setTag(this.tag);
              else this.setTag(this.tag);
              if (this.dappContainer) this.dappContainer.setTag(this.tag);
            },
            redo: () => { }
          }
        },
        userInputDataSchema: formSchema.dataSchema,
        userInputUISchema: formSchema.uiSchema,
        customControls: formSchema.customControls(this.rpcWallet?.instanceId)
      }
    ]

    return actions
  }

  getConfigurators() {
    let self = this;
    return [
      {
        name: 'Builder Configurator',
        target: 'Builders',
        getActions: this._getActions.bind(this),
        getData: this.getData.bind(this),
        setData: async (data: IEmbedData) => {
          const defaultData = configData.defaultBuilderData as any;
          await this.setData({ ...defaultData, ...data });
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
          }
        },
        setLinkParams: async (params: any) => {
          if (params.data) {
            const utf8String = decodeURIComponent(params.data);
            const decodedString = window.atob(utf8String);
            const newData = JSON.parse(decodedString);
            let resultingData = {
              ...self._data,
              ...newData
            };
            await self.setData(resultingData);
          }
        },
        getData: this.getData.bind(this),
        setData: this.setData.bind(this),
        setTag: this.setTag.bind(this),
        getTag: this.getTag.bind(this)
      }
    ]
  }

  private getData() {
    return this._data;
  }

  private async resetRpcWallet() {
    this.removeRpcWalletEvents();
    const rpcWalletId = await this.state.initRpcWallet(this.defaultChainId);
    const rpcWallet = this.rpcWallet;
    const chainChangedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.ChainChanged, async (chainId: number) => {
      this.onChainChanged();
    });
    const connectedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
      this.refreshTokenInfo();
    });
    this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);

    const data = {
      defaultChainId: this.defaultChainId,
      wallets: this.wallets,
      networks: this.networks,
      showHeader: this.showHeader,
      rpcWalletId: rpcWallet.instanceId || ''
    }
    if (this.dappContainer?.setData) this.dappContainer.setData(data);
  }

  private async setData(data: IEmbedData) {
    this._data = data;
    await this.resetRpcWallet();
    await this.initializeWidgetConfig();
  }

  private getTag() {
    return this.tag;
  }

  private updateTag(type: 'light' | 'dark', value: any) {
    this.tag[type] = this.tag[type] ?? {};
    for (let prop in value) {
      if (value.hasOwnProperty(prop))
        this.tag[type][prop] = value[prop];
    }
  }

  async setTag(value: any) {
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

  private updateStyle(name: string, value: any) {
    value ?
      this.style.setProperty(name, value) :
      this.style.removeProperty(name);
  }

  private updateTheme() {
    const themeVar = this.dappContainer?.theme || 'light';
    this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
    this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
    this.updateStyle('--input-font_color', this.tag[themeVar]?.inputFontColor);
    this.updateStyle('--input-background', this.tag[themeVar]?.inputBackgroundColor);
    this.updateStyle('--colors-primary-main', this.tag[themeVar]?.buttonBackgroundColor);
  }

  private initializeWidgetConfig = async () => {
    if (!this.imgLogo.isConnected) await this.imgLogo.ready();
    if (!this.lbDescription.isConnected) await this.lbDescription.ready();
    if (!this.tokenInput.isConnected) await this.tokenInput.ready();
    this.imgLogo.url = this.logo;
    this.lbDescription.caption = this.description;
    this.refreshTokenInfo();
  }

  private initWallet = async () => {
    try {
      await Wallet.getClientInstance().init();
      await this.rpcWallet.init();
    } catch (err) {
      console.log(err);
    }
  }

  private refreshTokenInfo = async () => {
    if (!this.tokenInput.isConnected) await this.tokenInput.ready();
    const rpcWallet = this.rpcWallet;
    const { instanceId, address } = rpcWallet;
    tokenStore.updateTokenMapData(this.chainId);
    if (address) {
      await tokenStore.updateAllTokenBalances(rpcWallet);
    }
    if (instanceId && instanceId !== this.tokenInput.rpcWalletId) {
      this.tokenInput.rpcWalletId = instanceId;
    }
    await this.initWallet();
    this.updateTokenObject();
    this.updateTokenInput();
  }

  private updateTokenObject = () => {
    const chainId = this.chainId;
    const tokensByChainId = this.tokenList.filter(f => f.chainId === chainId);
    this.tokenInput.tokenDataListProp = tokensByChainId;
    this.tokenObj = tokensByChainId[0];
    this.tokenInput.token = this.tokenObj ? { ...this.tokenObj } : undefined;
    this.tokenInput.tokenReadOnly = tokensByChainId.length <= 1;
  }

  private updateTokenInput = async () => {
    this.tokenBalance = this.tokenObj?.chainId === this.chainId ? new BigNumber(tokenStore.getTokenBalance(this.tokenObj)) : new BigNumber(0);
    this.updateBtn();
  }

  private updateBtn = async () => {
    const isClientConnected = isClientWalletConnected();
    const isRpcConnected = this.state.isRpcWalletConnected();
    if (!this.btnSend.isConnected) await this.btnSend.ready();
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
  }

  private onSelectToken = (token: ITokenObject) => {
    this.tokenObj = token;
    this.updateTokenInput();
  }

  private onInputAmountChanged = () => {
    this.updateBtn();
  }

  private onSetMaxBalance = () => {
    this.updateBtn();
  }

  private sendToken = async () => {
    if (!isClientWalletConnected()) {
      if (this.mdWallet) {
        await application.loadPackage('@scom/scom-wallet-modal', '*');
        this.mdWallet.networks = this.networks;
        this.mdWallet.wallets = this.wallets;
        this.mdWallet.showModal();
      }
      return;
    }
    if (!this.state.isRpcWalletConnected()) {
      const clientWallet = Wallet.getClientInstance();
      await clientWallet.switchNetwork(this.chainId);
      return;
    }
    if (!this.tokenObj || !this._data.recipient) return;
    this.txStatusModal.message = {
      status: 'warning',
      content: 'Sending...'
    }
    this.txStatusModal.showModal();

    const callBack = (error: Error, receipt?: string) => {
      if (error) {
        this.txStatusModal.message = {
          status: 'error',
          content: error
        }
      } else {
        this.txStatusModal.message = {
          status: 'success',
          content: receipt
        }
        this.tokenInput.readOnly = true;
        this.btnSend.enabled = false;
        this.btnSend.caption = 'Sending';
        this.btnSend.rightIcon.visible = true;
      }
      this.txStatusModal.showModal();
    }

    const confirmationCallBack = async () => {
      this.updateTokenInput();
      this.$eventBus.dispatch(EventId.Paid);
      this.tokenInput.readOnly = false;
      this.btnSend.rightIcon.visible = false;
    }

    registerSendTxEvents({
      transactionHash: callBack,
      confirmation: confirmationCallBack
    })

    sendToken(this.tokenObj, this._data.recipient, this.tokenInput.amount, callBack, confirmationCallBack);
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
    return (
      <i-scom-dapp-container id="dappContainer" class={dappContainerStyle}>
        <i-panel background={{ color: Theme.background.main }} padding={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <i-vstack gap={10} verticalAlignment="center" horizontalAlignment="center">
            <i-image id="imgLogo" width={100} height={100} />
            <i-label id="lbDescription" font={{ bold: true, size: '24px' }} class="text-center" />
            <i-scom-token-input
              id="tokenInput"
              title="&nbsp;"
              type="combobox"
              class={tokenInputStyle}
              onInputAmountChanged={this.onInputAmountChanged}
              onSetMaxBalance={this.onSetMaxBalance}
              onSelectToken={(token: ITokenObject) => this.onSelectToken(token)}
            />
            <i-button
              id="btnSend"
              caption="Send"
              class={buttonStyle}
              width={200}
              maxWidth="100%"
              padding={{ top: '0.5rem', bottom: '0.5rem', left: '1rem', right: '1rem' }}
              font={{ size: '1rem', color: Theme.colors.primary.contrastText }}
              rightIcon={{ visible: false, spin: true, fill: Theme.colors.primary.contrastText }}
              onClick={this.sendToken}
            />
          </i-vstack>
          <i-scom-tx-status-modal id="txStatusModal" />
          <i-scom-wallet-modal id="mdWallet" wallets={[]} />
        </i-panel>
      </i-scom-dapp-container>
    )
  }
}
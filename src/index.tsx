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
import { ICustomToken, IEmbedData } from './interface';
import { getTokenBalance, parseContractError, registerSendTxEvents } from './utils/index';
import { EventId, setDataFromSCConfig, getImageIpfsUrl, setDefaultChainId, getChainId, initRpcWallet, getRpcWallet, isRpcWalletConnected, isClientWalletConnected } from './store/index';
import { ChainNativeTokenByChainId, DefaultERC20Tokens, ITokenObject, tokenStore } from '@scom/scom-token-list';
import { buttonStyle, dappContainerStyle } from './index.css';
import { Alert } from './alert/index';
import { sendToken } from './API';
import configData from './data.json';
import formSchema from './formSchema.json';
import { INetworkConfig } from '@scom/scom-network-picker';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomTokenInput from '@scom/scom-token-input';
import ScomWalletModal, { IWalletPlugin } from '@scom/scom-wallet-modal';

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
  private imgLogo: Image;
  private lbDescription: Label;
  private tokenInput: ScomTokenInput;
  private btnSend: Button;
  private mdAlert: Alert;
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
  private clientEvents: any[] = [];

  constructor(parent?: Container, options?: any) {
    super(parent, options);
    if (configData) setDataFromSCConfig(configData);
    this.$eventBus = application.EventBus;
    this.registerEvent();
  }

  onHide() {
    this.dappContainer.onHide();
    const rpcWallet = getRpcWallet();
    for (let event of this.rpcWalletEvents) {
      rpcWallet.unregisterWalletEvent(event);
    }
    this.rpcWalletEvents = [];
    for (let event of this.clientEvents) {
      event.unregister();
    }
    this.clientEvents = [];
  }

  private registerEvent() {
    this.clientEvents.push(this.$eventBus.register(this, EventId.chainChanged, this.onChainChanged));
  }

  private onChainChanged = async () => {
    this.refreshTokenInfo();
  }

  static async create(options?: ScomTipMeElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
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
    return this._data.logo ?? '';
  }
  set logo(value: string) {
    this._data.logo = value;
  }

  get tokens() {
    return this._data.tokens ?? [];
  }
  set tokens(value: ICustomToken[]) {
    this._data.tokens = value;
  }

  private get tokenList() {
    if (!this.tokens) return [];
    let list = [];
    for (const inputToken of this.tokens) {
      const tokenAddress = inputToken.address?.toLowerCase();
      const nativeToken = ChainNativeTokenByChainId[inputToken.chainId] as any;
      if (!tokenAddress || tokenAddress === nativeToken?.symbol?.toLowerCase()) {
        if (nativeToken) list.push({ ...nativeToken, chainId: inputToken.chainId });
      } else {
        const tokens = DefaultERC20Tokens[inputToken.chainId];
        const token = tokens.find(v => v.address?.toLowerCase() === tokenAddress) as any;
        if (token) list.push({ ...token, chainId: inputToken.chainId });
      }
    }
    return list as ICustomToken[];
  }

  private _getActions() {
    const actions = [
      {
        name: 'Settings',
        icon: 'cog',
        command: (builder: any, userInputData: any) => {
          let _oldData: IEmbedData = {
            wallets: [],
            networks: [],
            defaultChainId: 0
          };
          return {
            execute: async () => {
              _oldData = { ...this._data };
              if (userInputData.logo != undefined) this._data.logo = userInputData.logo;
              if (userInputData.description != undefined) this._data.description = userInputData.description;
              if (userInputData.recipient != undefined) this._data.recipient = userInputData.recipient;
              this._data.tokens = userInputData.tokens || [];
              this.initializeWidgetConfig();
              if (builder?.setData) builder.setData(this._data);
            },
            undo: async () => {
              this._data = { ..._oldData };
              this.initializeWidgetConfig();
              if (builder?.setData) builder.setData(this._data);
            },
            redo: () => { }
          }
        },
        userInputDataSchema: formSchema.general.dataSchema
      },
      {
        name: 'Theme Settings',
        icon: 'palette',
        command: (builder: any, userInputData: any) => {
          let oldTag = {};
          return {
            execute: async () => {
              if (!userInputData) return;
              oldTag = JSON.parse(JSON.stringify(this.tag));
              if (builder) builder.setTag(userInputData);
              else this.setTag(userInputData);
              if (this.dappContainer) this.dappContainer.setTag(userInputData);
            },
            undo: () => {
              if (!userInputData) return;
              this.tag = JSON.parse(JSON.stringify(oldTag));
              if (builder) builder.setTag(this.tag);
              else this.setTag(this.tag);
              if (this.dappContainer) this.dappContainer.setTag(this.tag);
            },
            redo: () => { }
          }
        },
        userInputDataSchema: formSchema.theme.dataSchema
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

  private async setData(data: IEmbedData) {
    this._data = data;
    const rpcWalletId = initRpcWallet(this.defaultChainId);
    const rpcWallet = getRpcWallet();
    const event = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
      await this.refreshTokenInfo();
    });
    this.rpcWalletEvents.push(event);

    const containerData = {
      defaultChainId: this.defaultChainId,
      wallets: this.wallets,
      networks: this.networks,
      showHeader: this.showHeader,
      rpcWalletId: rpcWallet.instanceId
    }
    if (this.dappContainer?.setData) this.dappContainer.setData(containerData);
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
    this.imgLogo.url = getImageIpfsUrl(this.logo);
    this.lbDescription.caption = this.description;
    this.refreshTokenInfo();
  }

  private refreshTokenInfo = async () => {
    if (!this.tokenInput.isConnected) await this.tokenInput.ready();
    tokenStore.updateTokenMapData(getChainId());
    const rpcWallet = getRpcWallet();
    if (rpcWallet.address) {
      await tokenStore.updateAllTokenBalances(rpcWallet);
    }
    await Wallet.getClientInstance().init();
    this.updateTokenObject();
    this.updateTokenInput();
  }

  private updateTokenObject = () => {
    const chainId = getChainId();
    const tokensByChainId = this.tokenList.filter(f => f.chainId === chainId);
    this.tokenInput.rpcWalletId = chainId.toString();
    this.tokenInput.targetChainId = chainId;
    this.tokenInput.tokenDataListProp = tokensByChainId;
    this.tokenObj = tokensByChainId[0];
    this.tokenInput.token = this.tokenObj ? { ...this.tokenObj, chainId } : undefined;
    this.tokenInput.tokenReadOnly = tokensByChainId.length <= 1;
  }

  private updateTokenInput = async () => {
    this.tokenBalance = new BigNumber(tokenStore.getTokenBalance(this.tokenObj) || 0);
    this.updateBtn();
  }

  private updateBtn = async () => {
    const isClientConnected = isClientWalletConnected();
    const isRpcConnected = isRpcWalletConnected();
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
    if (!isRpcWalletConnected()) {
      const chainId = getChainId();
      const clientWallet = Wallet.getClientInstance();
      await clientWallet.switchNetwork(chainId);
      return;
    }
    if (!this.tokenObj || !this._data.recipient) return;
    this.mdAlert.message = {
      status: 'warning',
      content: 'Sending...'
    }
    this.mdAlert.showModal();

    const callBack = (error: Error, receipt?: string) => {
      if (error) {
        this.mdAlert.message = {
          status: 'error',
          content: parseContractError(error)
        }
      } else {
        this.mdAlert.message = {
          status: 'success',
          content: receipt
        }
        this.tokenInput.readonly = true;
        this.btnSend.enabled = false;
        this.btnSend.caption = 'Sending';
        this.btnSend.rightIcon.visible = true;
      }
      this.mdAlert.showModal();
    }

    const confirmationCallBack = async () => {
      this.updateTokenInput();
      this.$eventBus.dispatch(EventId.Paid);
      this.tokenInput.readonly = false;
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
      setDefaultChainId(defaultChainId);
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
              withoutConnected={true}
              onInputAmountChanged={this.onInputAmountChanged}
              onSetMaxBalance={this.onSetMaxBalance}
              onSelectToken={(token: any) => this.onSelectToken(token)}
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
          <i-scom-tip-me-alert id="mdAlert" />
          <i-scom-wallet-modal id="mdWallet" wallets={[]} />
        </i-panel>
      </i-scom-dapp-container>
    )
  }
}
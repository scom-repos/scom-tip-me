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
  IDataSchema,
  ControlElement
} from '@ijstech/components';
import { BigNumber } from '@ijstech/eth-wallet';
import { ICustomToken, IEmbedData, ITokenObject, IWalletPlugin } from './interface';
import { getTokenBalance, parseContractError, registerSendTxEvents } from './utils/index';
import { EventId, setDataFromSCConfig, isWalletConnected, getImageIpfsUrl, setDefaultChainId, getChainId } from './store/index';
import { ChainNativeTokenByChainId, DefaultERC20Tokens } from '@scom/scom-token-list';
import { buttonStyle, dappContainerStyle } from './index.css';
import { Alert } from './alert/index';
import { sendToken } from './API';
import configData from './data.json';
import { INetworkConfig } from '@scom/scom-network-picker';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomTokenInput from '@scom/scom-token-input';
import ScomWalletModal from '@scom/scom-wallet-modal';

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
  readonly onConfirm: () => Promise<void>;
  readonly onDiscard: () => Promise<void>;
  readonly onEdit: () => Promise<void>;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
    if (configData) setDataFromSCConfig(configData);
    this.$eventBus = application.EventBus;
    this.registerEvent();
  }

  static async create(options?: ScomTipMeElement, parent?: Container) {
    let self = new this(parent, options);
    await self.ready();
    return self;
  }

  private registerEvent() {
    this.$eventBus.register(this, EventId.IsWalletConnected, () => this.onWalletConnect(true));
    this.$eventBus.register(this, EventId.IsWalletDisconnected, () => this.onWalletConnect(false));
    this.$eventBus.register(this, EventId.chainChanged, this.onChainChanged);
  }

  private onWalletConnect = async (connected: boolean) => {
    this.updateTokenInput();
  }

  private onChainChanged = async (chainId: number) => {
    this.updateTokenObject();
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

  private getSchema = () => {
    const propertiesSchema: any = {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
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
                enum: [1, 56, 137, 250, 97, 80001, 43113, 43114],
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
    }
    const themeSchema: IDataSchema = {
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
    return this._getActions(propertiesSchema, themeSchema);
  }

  private _getActions(propertiesSchema: IDataSchema, themeSchema: IDataSchema) {
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
              this.refreshDApp();
              if (builder?.setData) builder.setData(this._data);
            },
            undo: async () => {
              this._data = { ..._oldData };
              this.refreshDApp();
              if (builder?.setData) builder.setData(this._data);
            },
            redo: () => { }
          }
        },
        userInputDataSchema: propertiesSchema
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
        userInputDataSchema: themeSchema
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
        getActions: this.getSchema.bind(this),
        getData: this.getData.bind(this),
        setData: async (data: IEmbedData) => {
          const defaultData = configData.defaultBuilderData as any;
          await this.setData({ ...defaultData, ...data });
          if (this.mdWallet) {
            this.mdWallet.networks = this._data.networks;
            this.mdWallet.wallets = this._data.wallets;
          }
        },
        setTag: this.setTag.bind(this),
        getTag: this.getTag.bind(this)
      },
      {
        name: 'Emdedder Configurator',
        target: 'Embedders',
        getActions: this.getSchema.bind(this),
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
    await this.refreshDApp();
    if (this.mdWallet) {
      this.mdWallet.networks = this._data.networks;
      this.mdWallet.wallets = this._data.wallets;
    }
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
    return list;
  }

  private refreshDApp = async () => {
    const data: any = {
      defaultChainId: this.defaultChainId,
      wallets: this.wallets,
      networks: this.networks,
      showHeader: this.showHeader
    }
    if (this.dappContainer?.setData) this.dappContainer.setData(data);
    if (!this.imgLogo.isConnected) await this.imgLogo.ready();
    if (!this.lbDescription.isConnected) await this.lbDescription.ready();
    if (!this.tokenInput.isConnected) await this.tokenInput.ready();
    this.tokenInput.tokenDataListProp = this.tokenList;
    this.imgLogo.url = getImageIpfsUrl(this.logo);
    this.lbDescription.caption = this.description;
    this.updateTokenObject();
    this.updateTokenInput();
  }

  private updateTokenObject = () => {
    const chainId = getChainId();
    const tokensByChainId = this.tokenList.filter(f => f.chainId === chainId);
    this.tokenObj = tokensByChainId[0];
    this.tokenInput.targetChainId = chainId;
    this.tokenInput.tokenReadOnly = tokensByChainId.length <= 1;
    this.tokenInput.token = this.tokenObj ? { ...this.tokenObj, chainId } : undefined;
  }

  private updateTokenInput = async () => {
    if (this.tokenObj && isWalletConnected()) {
      this.tokenBalance = await getTokenBalance(this.tokenObj);
    } else {
      this.tokenBalance = new BigNumber(0);
    }
    this.updateBtn();
  }

  private updateBtn = () => {
    const isConnected = isWalletConnected();
    this.btnSend.caption = isConnected ? 'Send' : 'Connect Wallet';
    if (!isConnected) {
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
    if (!isWalletConnected()) {
      this.mdWallet.showModal();
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
          <i-scom-wallet-modal
            id="mdWallet"
            wallets={[]}
          />
        </i-panel>
      </i-scom-dapp-container>
    )
  }
}
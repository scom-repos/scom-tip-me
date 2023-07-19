import { Styles } from "@ijstech/components";
const Theme = Styles.Theme.ThemeVars;

export const dappContainerStyle = Styles.style({
  $nest: {
    '& > i-vstack > i-panel': {
      overflow: 'visible'
    },
    'dapp-container-body': {
      overflow: 'inherit'
    }
  }
})

export const buttonStyle = Styles.style({
  $nest: {
    '&.disabled': {
      background: Theme.colors.primary.main
    },
    'i-icon svg': {
      fill: Theme.colors.primary.contrastText
    }
  }
})

export const tokenInputStyle = Styles.style({
  $nest: {
    '#gridTokenInput': {
      borderRadius: 16,
      paddingBlock: '8px !important'
    },
    '#btnToken': {
      minWidth: 120
    }
  }
})

import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import sb from "satoshi-bitcoin"
import AddressValidator from "wallet-address-validator";
import bchaddr from 'bchaddrjs'
import {
    addTx,
    updateTx,
    removeTx,
    initGJSDeposit,
    initGJSWithdraw,
    gatherFeeData,
    MIN_TX_AMOUNTS
} from '../utils/txUtils'
import {
  MINI_ICON_MAP,
  SYMBOL_MAP,
  NETWORK_MAP,
  NAME_MAP,
  initLocalWeb3,
  setWbtcAllowance,
  abbreviateAddress,
  updateBalance,
  modifyNumericInput
} from '../utils/walletUtils'
import Web3 from "web3";
import { ethers } from 'ethers';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import CurrencyInput from '../components/CurrencyInput';
import CurrencySelect from '../components/CurrencySelect';
import BigCurrencyInput from '../components/BigCurrencyInput';
import ActionLink from '../components/ActionLink';
import adapterABI from "../utils/adapterABI.json";

import WalletIcon from '../assets/wallet-icon.svg'

const styles = (theme) => ({
    container: {
        background: '#fff',
        border: '1px solid ' + theme.palette.divider,
        borderRadius: 4,
        boxShadow: '0px 1px 2px rgba(0, 27, 58, 0.05)',
        maxWidth: 400,
        width: '100%',
        margin: '0px auto',
        [theme.breakpoints.down('sm')]: {
            maxWidth: '100%',
        },
    },
    transferActionTabs: {
        margin: '0px auto',
        // marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
        '& div.MuiToggleButtonGroup-root': {
            width: '100%'
        },
        '& button': {
            width: '50%'
        }
    },
    depositAddressContainer: {
    },
    depositAddress: {
        width: '100%',
    },
    actionButtonContainer: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        textAlign: 'center',
        '& button': {
            '&.Mui-disabled': {
            },
            margin: '0px auto',
            fontSize: 12,
            minWidth: 175,
            padding: theme.spacing(1)
        }
    },
    amountField: {
        width: '100%'
    },
    depositButton: {
    },
    withdrawButton: {
    },
    actions: {
        paddingTop: theme.spacing(1),
        padding: theme.spacing(3)
    },
    transactionsContainer: {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(0),
        marginTop: theme.spacing(2),
        borderTop: '1px solid #EBEBEB'
    },
    actionsContainer: {
        borderRadius: theme.shape.borderRadius,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    destChooser: {
      width: '100%',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
      '& div.MuiToggleButtonGroup-root': {
          width: '100%'
      },
      '& button': {
          width: '50%'
      }
    },
    fees: {
        width: '100%',
        border: '1px solid ' + theme.palette.divider,
        fontSize: 12,
        padding: theme.spacing(1),
        paddingBottom: 0,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(3),
        display: 'flex',
        flexDirection:'column',
        '& span': {
            marginBottom: theme.spacing(1)
        }
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: theme.spacing(0.75),
    },
    toggle: {
      '& button': {
        minHeight: 'auto',
        border: '1px solid transparent',
        borderBottom: '1px solid ' + theme.palette.divider,
        height: 56,
        backgroundColor: '#fff',
        '&:first-child': {
          borderRight: '1px solid ' + theme.palette.divider
        },
        '&.MuiToggleButton-root': {
        },
        '&.Mui-selected': {
          borderBottom: '1px solid transparent',
          color: theme.palette.primary.main,
          backgroundColor: '#transparent !important',
        },
        '& .MuiToggleButton-label': {
          fontSize: 16,
        },
        '& span': {
          textTransform: 'capitalize !important',
        }
      }
    },
    title: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(3)
    },
    optionsContainer: {
        border: '1px solid ' + theme.palette.divider,
        borderBottom: 'none',
        borderRadius: 4,
        boxShadow: '0px 1px 2px rgba(0, 27, 58, 0.05)'
    },
    option: {
        borderBottom: '1px solid ' + theme.palette.divider,
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        minHeight: 60,
        fontSize: 14,
        '& img': {
            height: 'auto',
            width: 24,
            marginRight: theme.spacing(1)
        },
        '& .MuiGrid-root': {
            display: 'flex',
            alignItems: 'center'
        }
    },
    addressInput: {
        width: '100%',
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2)
    },
    currencySelect: {
        marginLeft: theme.spacing(-1),
        width: 'calc(100% + 8px)'
    },
    balanceContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        marginBottom: theme.spacing(1)
    },
    amountContainer: {
        paddingTop: theme.spacing(5),
        paddingBottom: theme.spacing(5)
    },
    totalCell: {
        wordBreak: 'break-word'
    }
})

class TransferContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
        this.burnInputRef = React.createRef()
    }

    componentDidMount() {
        // for debugging
        window.addTx = addTx.bind(this)
        window.updateTx = updateTx.bind(this)
        window.removeTx = removeTx.bind(this)
        window.store = this.props.store
    }

    showDepositModal(tx) {
        const { store } = this.props
        store.set('showDepositModal', true)
        store.set('depositModalTx', tx)
    }

    async gatherFeeData() {

    }

    getBalance(asset) {
        const { store } = this.props
        return store.get(`ren${asset.toUpperCase()}Balance`)
    }

    async newDeposit() {
        const { store } = this.props

        const amount = store.get('convert.amount')
        const localWeb3Address = store.get('localWeb3Address')
        const network = store.get('selectedNetwork')
        const format = store.get('convert.selectedFormat')
        const asset = store.get('selectedAsset')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'convert',
            instant: false,
            // awaiting: `${asset}-init`,
            sourceAsset: asset,
            sourceNetwork: NETWORK_MAP[asset],
            sourceNetworkVersion: network,
            destAddress: localWeb3Address,
            destNetwork: NETWORK_MAP[format],
            destNetworkVersion: network,
            destAsset: format,
            amount: amount,
            error: false,
            txHash: ''
        }

        store.set('confirmTx', tx)
        store.set('confirmAction', 'deposit')
    }

    async newWithdraw() {
        const { store } = this.props

        const amount = store.get('convert.amount')
        const destination = store.get('convert.destination')
        const network = store.get('selectedNetwork')
        const format = store.get('convert.selectedFormat')
        const asset = store.get('selectedAsset')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'convert',
            instant: false,
            // awaiting: 'eth-settle',
            sourceAsset: format,
            sourceNetwork: NETWORK_MAP[format],
            sourceNetworkVersion: network,
            destAddress: destination,
            destNetwork: NETWORK_MAP[asset],
            destNetworkVersion: network,
            destAsset: asset,
            amount: amount,
            error: false,
            txHash: ''
        }

        store.set('confirmTx', tx)
        store.set('confirmAction', 'withdraw')
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const walletAddress = store.get('walletAddress')
        const transactions = store.get('transactions')
        const selectedNetwork = store.get('selectedNetwork')
        const selectedTab  = store.get('selectedTab')
        const selectedTransferTab  = store.get('selectedTransferTab')
        const selectedAsset  = store.get('selectedAsset')
        const showAboutModal = store.get('showAboutModal')


        // 0 = mint, 1 = release
        const selectedDirection  = store.get('convert.selectedDirection')
        const selectedFormat = store.get('convert.selectedFormat')

        const localWeb3Address = store.get('localWeb3Address')
        const space = store.get('space')
        const balance = store.get(SYMBOL_MAP[selectedFormat] + 'Balance')
        const address = store.get('convert.destination')
        const addressValid = store.get('convert.destinationValid')
        const addressFocused = store.get('convert.destinationInputFocused')

        const amount = store.get('convert.amount')
        const exchangeRate = store.get('convert.exchangeRate')
        const fee = store.get('convert.networkFee')
        const total = store.get('convert.conversionTotal')

        const allowance = store.get('convert.adapterWbtcAllowance')
        const hasAllowance = Number(amount) <= Number(allowance)
        const allowanceRequesting = store.get('convert.adapterWbtcAllowanceRequesting')

        const convertAddressValid = store.get('convert.destinationValid')
        const canConvertTo = amount > MIN_TX_AMOUNTS[selectedAsset]
        const canConvertFrom = Number(amount) > MIN_TX_AMOUNTS[selectedAsset] && amount <= Number(balance) && convertAddressValid
        const showAddressError = !addressFocused && address && !convertAddressValid

        const sourceAsset = selectedDirection ? selectedFormat : selectedAsset
        const destAsset = selectedDirection ? selectedAsset : selectedFormat

        const usdValue = Number(store.get(`${selectedAsset}usd`) * amount).toFixed(2)

        return <div className={classes.container}>
            {<Grid container className={classes.transferActionTabs}>
                <ToggleButtonGroup
                    size='small'
                    className={classes.toggle}
                    value={String(selectedDirection)}
                    exclusive
                    onChange={(event, newValue) => {
                        if (newValue) {
                            store.set('convert.selectedDirection', Number(newValue))
                            store.set('convert.amount', '')
                            store.set('convert.networkFee', '')
                            store.set('convert.conversionTotal', '')
                            store.set('convert.destination', '')
                        }
                    }}>
                    <ToggleButton disableRipple={true} key={0} value={'0'}>
                      Mint
                    </ToggleButton>
                    <ToggleButton disableRipple={true} key={1} value={'1'}>
                      Release
                    </ToggleButton>
                </ToggleButtonGroup>
            </Grid>}
            {selectedTab === 1 && <div className={classes.actionsContainer}>
                <Grid className={classes.actions}>
                    <Grid container justify='center'>
                        <Grid item xs={12}>

                            {selectedDirection === 0 && <React.Fragment>
                                <Grid className={classes.amountContainer} container>
                                  <BigCurrencyInput symbol={SYMBOL_MAP[selectedAsset]}
                                      placeholder={'0.00 ' + SYMBOL_MAP[selectedAsset]}
                                      usdValue={usdValue}
                                      value={amount}
                                      onChange={(value, string, input) => {
                                        modifyNumericInput(value, string, input)
                                        store.set('convert.amount', value)
                                        gatherFeeData()
                                      }}/>
                                </Grid>
                                <Grid className={classes.optionsContainer} container direction='column'>
                                    <Grid container className={classes.option}>
                                        <Grid item xs={6}>
                                            Asset
                                        </Grid>
                                        <Grid item xs={6}>
                                            <CurrencySelect active={SYMBOL_MAP[selectedAsset]}
                                              className={classes.currencySelect}
                                              items={['BTC', 'ZEC', 'BCH']}
                                              onCurrencyChange={(v) => {
                                                const asset = v.toLowerCase()
                                                store.set('convert.selectedFormat', `ren${asset}`)
                                                store.set('selectedAsset', asset)
                                                gatherFeeData()
                                              }} />
                                        </Grid>
                                    </Grid>
                                    <Grid container className={classes.option}>
                                        <Grid item xs={6}>
                                            Destination
                                        </Grid>
                                        <Grid item xs={6}>
                                            <img src={WalletIcon}/>{abbreviateAddress(localWeb3Address)}
                                        </Grid>
                                    </Grid>
                                    <Grid container className={classes.option}>
                                        <Grid item xs={6}>
                                            You will receive
                                        </Grid>
                                        <Grid item xs={6} className={classes.totalCell}>
                                            <img src={MINI_ICON_MAP[destAsset]}/>{total || ''} {SYMBOL_MAP[destAsset]}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </React.Fragment>}

                            {selectedDirection === 1 && <React.Fragment>
                                <Grid className={classes.amountContainer} container>
                                  <BigCurrencyInput symbol={SYMBOL_MAP[selectedFormat]}
                                      value={amount}
                                      inputRef={this.burnInputRef}
                                      placeholder={'0.00 ' + SYMBOL_MAP[selectedFormat]}
                                      usdValue={usdValue}
                                      onChange={(value, string, input) => {
                                        modifyNumericInput(value, string, input)
                                        store.set('convert.amount', value)
                                        gatherFeeData()
                                      }}/>
                                </Grid>
                                <Grid className={classes.balanceContainer} container justify='space-between'>
                                  <Typography variant='caption'>{SYMBOL_MAP[selectedFormat]} Balance</Typography>
                                  <Typography><ActionLink onClick={() => {
                                        this.burnInputRef.current.refsInput.setValue(`${balance} ${SYMBOL_MAP[selectedFormat]}`)
                                        console.log(this.burnInputRef, this.burnInputRef.current)
                                    }}>{balance} {SYMBOL_MAP[selectedFormat]}</ActionLink></Typography>
                                </Grid>

                                <Grid className={classes.optionsContainer} container direction='column'>
                                    <Grid container className={classes.option}>
                                        <Grid item xs={6}>
                                            Asset
                                        </Grid>
                                        <Grid item xs={6} onClick={updateBalance}>
                                            <CurrencySelect active={SYMBOL_MAP[selectedFormat]}
                                              className={classes.currencySelect}
                                              items={['renBTC', 'renZEC', 'renBCH']}
                                              renBTCBalance={store.get('renBTCBalance')}
                                              renZECBalance={store.get('renZECBalance')}
                                              renBCHBalance={store.get('renBCHBalance')}
                                              onCurrencyChange={(v) => {
                                                const asset = v.toLowerCase()
                                                store.set('convert.selectedFormat', asset)
                                                store.set('selectedAsset', asset.replace('ren', ''))
                                                gatherFeeData()
                                              }} />
                                        </Grid>
                                    </Grid>
                                    <Grid container className={classes.option}>
                                        <Grid xs={12}>
                                            <div className={classes.addressInput}>
                                                <TextField label="Destination"
                                                    placeholder={`Enter ${NAME_MAP[selectedAsset]} Address`}
                                                    size='large'
                                                    fullWidth={true}
                                                    error={showAddressError}
                                                    helperText={showAddressError ? `Please enter a valid ${NAME_MAP[selectedAsset]} address`: ''}
                                                    InputProps={{
                                                        disableUnderline: true,
                                                    }}
                                                    InputLabelProps={{
                                                        shrink: true
                                                    }}
                                                    inputProps={{
                                                        onFocus: () => {
                                                            store.set('convert.destinationInputFocused', true)
                                                        },
                                                        onBlur: () => {
                                                            store.set('convert.destinationInputFocused', false)
                                                        }
                                                    }}
                                                    onChange={(event) => {
                                                      const value = event.target.value
                                                      store.set('convert.destination', value)
                                                      if (selectedAsset === 'bch') {
                                                          store.set('convert.destinationValid', bchaddr.isValidAddress(value))
                                                      } else {
                                                          store.set('convert.destinationValid', AddressValidator.validate(
                                                            value,
                                                            selectedAsset.toUpperCase(),
                                                            selectedNetwork === 'testnet' ? 'testnet' : 'prod'
                                                          ))
                                                      }

                                                  }}/>
                                            </div>
                                        </Grid>

                                    </Grid>
                                    <Grid container className={classes.option}>
                                        <Grid item xs={6}>
                                            You will receive
                                        </Grid>
                                        <Grid item xs={6} className={classes.totalCell}>
                                            <img src={MINI_ICON_MAP[destAsset]}/>{total || ''} {SYMBOL_MAP[destAsset]}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </React.Fragment>}


                        </Grid>

                    </Grid>

                    <Grid container justify='center' className={classes.actionButtonContainer}>
                        {selectedDirection === 0 && <Grid item xs={12}>
                            <Button
                                disabled={!canConvertTo}
                                variant={'contained'}
                                disableRipple
                                color='primary'
                                size="large"
                                fullWidth
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newDeposit.bind(this)}>
                                Next
                            </Button>
                        </Grid>}
                        {selectedDirection === 1 && <Grid item xs={12}>
                            <Button
                                disabled={!canConvertFrom}
                                variant={'contained'}
                                disableRipple
                                color='primary'
                                fullWidth
                                size='large'
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newWithdraw.bind(this)}>
                                Next
                            </Button>
                        </Grid>}
                    </Grid>

                </Grid>
            </div>}
        </div>
    }
}

export default withStyles(styles)(withStore(TransferContainer))

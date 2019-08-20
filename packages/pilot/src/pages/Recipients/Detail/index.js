import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import withRouter from 'react-router-dom/withRouter'
import { connect } from 'react-redux'
import moment from 'moment'
import { Alert, Snackbar } from 'former-kit'
import IconInfo from 'emblematic-icons/svg/Info32.svg'
import IconClose from 'emblematic-icons/svg/ClearClose32.svg'

import {
  assocPath,
  compose,
  lensPath,
  pathOr,
  pipe,
  propEq,
  reject,
  view,
} from 'ramda'

import itemsPerPage from '../../../models/itemsPerPage'

import ConfirmModal from '../../../components/ConfirmModal'
import DetailRecipient from '../../../containers/RecipientDetails'
import Loader from '../../../components/Loader'
import style from './style.css'

const mapStateToProps = (state = {}) => {
  const { account } = state
  const { client } = account || {}
  return { client }
}

const enhanced = compose(
  connect(mapStateToProps),
  translate(),
  withRouter
)

const handleExportDataSuccess = (res, format) => {
  /* eslint-disable no-undef */
  let contentType
  if (format === 'xlsx') {
    contentType = 'application/ms-excel'
  } else {
    contentType = 'text/csv;charset=utf-8'
  }

  const blob = new Blob([res], { type: contentType })
  const filename = `PagarMe_Extrato_${moment().format('DD/MM/YYYY')}.${format}`

  const downloadLink = document.createElement('a')
  downloadLink.target = '_blank'
  downloadLink.download = filename
  const URL = window.URL || window.webkitURL
  const downloadUrl = URL.createObjectURL(blob)
  downloadLink.href = downloadUrl
  document.body.append(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  URL.revokeObjectURL(downloadUrl)
  /* eslint-enable no-undef */
}

class DetailRecipientPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      anticipationError: false,
      anticipationLimitAmount: 0,
      anticipationToCancel: null,
      balance: {},
      currentPage: 1,
      dates: {
        end: moment(),
        start: moment().subtract(7, 'day'),
      },
      exporting: false,
      loading: true,
      pageError: false,
      recipientData: {},
      selectedItemsPerPage: 15,
      showModal: false,
      showSnackbar: false,
      total: {},
    }

    this.fetchAnticipationLimit = this.fetchAnticipationLimit.bind(this)
    this.fetchBalance = this.fetchBalance.bind(this)
    this.fetchBalanceTotal = this.fetchBalanceTotal.bind(this)
    this.fetchData = this.fetchData.bind(this)
    this.fetchRecipientData = this.fetchRecipientData.bind(this)
    this.handleAnticipationCancel = this.handleAnticipationCancel.bind(this)
    this.handleDateFilter = this.handleDateFilter.bind(this)
    this.handleExportData = this.handleExportData.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handlePageCountChange = this.handlePageCountChange.bind(this)
    this.handleSaveAnticipation = this.handleSaveAnticipation.bind(this)
    this.handleSaveBankAccount = this.handleSaveBankAccount.bind(this)
    this.handleSaveBankAccountWithBank = this.handleSaveBankAccountWithBank
      .bind(this)
    this.handleSaveBankAccountWithId = this.handleSaveBankAccountWithId
      .bind(this)
    this.handleSaveTransfer = this.handleSaveTransfer.bind(this)
    this.hideCancelAnticipationModal = this.hideCancelAnticipationModal
      .bind(this)
    this.handleOpenSnackbar = this.handleOpenSnackbar.bind(this)
    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this)
    this.sendToAnticipationPage = this.sendToAnticipationPage.bind(this)
    this.sendToWithdrawPage = this.sendToWithdrawPage.bind(this)
    this.showCancelAnticipationModal = this.showCancelAnticipationModal
      .bind(this)
  }

  componentDidMount () {
    this.fetchData()
  }

  handleOpenSnackbar () {
    this.setState({ showSnackbar: true })
  }

  handleCloseSnackbar () {
    this.setState({ showSnackbar: false })
  }

  handleSaveAnticipation (anticipationData) {
    const { client, match } = this.props
    const { id } = match.params
    return client.recipient.update(id, { configuration: anticipationData })
      .then(() => {
        const anticipationPath = [
          'recipientData',
          'configurationData',
          'anticipation',
        ]
        const updateAnticipation = assocPath(anticipationPath, anticipationData)
        const newState = updateAnticipation(this.state)
        this.setState({
          ...newState,
          showSnackbar: true,
        })
      })
  }

  handleSaveTransfer (transferData) {
    const { client, match } = this.props
    const { id } = match.params
    const updatedData = {
      configuration: {
        ...transferData,
        anticipationModel: null,
      },
    }

    return client.recipient.update(id, updatedData)
      .then(() => {
        const transferPath = ['recipientData', 'configurationData', 'transfer']
        const updateTransfer = assocPath(transferPath, transferData)
        const newState = updateTransfer(this.state)
        this.setState({
          ...newState,
          showSnackbar: true,
        })
      })
  }

  handleSaveBankAccountWithId (data) {
    const { client, match } = this.props
    const { id } = match.params

    return client.recipient.update(id, { configuration: data })
  }

  handleSaveBankAccountWithBank (data) {
    const { client, match } = this.props
    const { recipientData } = this.state
    const { id } = match.params

    const { identification } = recipientData.informationData
    const { documentType } = identification

    return client.recipient.createNewAccount({
      bankAccount: data,
      identification: {
        documentType,
        [documentType]: recipientData
          .informationData.identification[documentType],
      },
    })
      .then((bankAccountCreated) => {
        const { accounts } = recipientData.configurationData
        this.setState({
          recipientData: {
            ...recipientData,
            configurationData: {
              ...recipientData.configurationData,
              accounts: [...accounts, bankAccountCreated],
            },
          },
        })

        return client.recipient.update(id, {
          configuration: {
            id: bankAccountCreated.id,
          },
        })
      })
  }

  handleSaveBankAccount (data) {
    let operation = Promise.resolve()

    if (data.id) {
      operation = this.handleSaveBankAccountWithId(data)
    } else if (data.bank) {
      operation = this.handleSaveBankAccountWithBank(data)
    }
    return operation
      .then((dataUpdated) => {
        const newState = pipe(
          assocPath(
            ['recipientData', 'configurationData', 'bankAccount'],
            dataUpdated.bank_account
          ),
          assocPath(
            ['recipientData', 'companyData', 'name'],
            dataUpdated.bank_account.name
          )
        )(this.state)

        this.setState({
          ...newState,
          showSnackbar: true,
        })
      })
  }

  handleDateFilter (dates) {
    const firstPage = 1
    const balancePromise = this.fetchBalance(dates, firstPage)
    const balanceTotalPromise = this.fetchBalanceTotal(dates)

    return Promise.all([balancePromise, balanceTotalPromise])
      .then(([balance, total]) => {
        this.setState({
          balance,
          currentPage: firstPage,
          dates,
          total,
        })
      })
      .catch((pageError) => {
        this.setState({
          pageError,
        })
      })
  }

  handleExportData (format) {
    this.setState({ exporting: true })
    const { client, match } = this.props
    const { dates } = this.state
    const startDate = dates.start.format('x')
    const endDate = dates.end.format('x')

    const { id: recipientId } = match.params
    return client
      .withVersion('2018-09-10')
      .balanceOperations
      .find({
        endDate,
        format,
        recipientId,
        startDate,
      })
      .then((res) => {
        this.setState({ exporting: false })
        handleExportDataSuccess(res, format)
      })
  }

  handlePageChange (page) {
    const { dates } = this.state

    return this.fetchBalance(dates, page)
      .then((balance) => {
        this.setState({
          balance,
          currentPage: page,
          dates,
        })
      })
  }

  handlePageCountChange (pageCount) {
    const {
      currentPage,
      dates,
    } = this.state

    this.setState({
      selectedItemsPerPage: pageCount,
    }, () => {
      this.fetchBalance(dates, currentPage)
        .then((balance) => {
          this.setState({
            balance,
          })
        })
    })
  }

  handleAnticipationCancel () {
    const { client, match } = this.props
    const { anticipationToCancel } = this.state
    const requestBody = {
      id: anticipationToCancel,
      recipientId: match.params.id,
    }

    return client.bulkAnticipations.cancel(requestBody)
      .then((response) => {
        const requestPath = ['balance', 'requests']
        const getRequests = view(lensPath(requestPath))
        const removeCanceled = reject(propEq('id', response.id))

        const oldRequests = getRequests(this.state)
        const newRequests = removeCanceled(oldRequests)

        const updateRequests = assocPath(requestPath, newRequests)
        const newState = updateRequests(this.state)

        this.setState({
          ...newState,
          anticipationToCancel: null,
          showModal: false,
        })
      })
      .catch((pageError) => {
        this.setState({
          ...this.state, // eslint-disable-line
          anticipationToCancel: null,
          pageError,
          showModal: false,
        })
      })
  }

  showCancelAnticipationModal (anticipationId) {
    return this.setState({
      anticipationToCancel: anticipationId,
      showModal: true,
    })
  }

  hideCancelAnticipationModal () {
    return this.setState({
      anticipationToCancel: null,
      showModal: false,
    })
  }

  fetchData () {
    const {
      currentPage,
      dates,
    } = this.state

    const recipientDataPromise = this.fetchRecipientData()
    const anticipationLimitPromise = this.fetchAnticipationLimit()
    const balancePromise = this.fetchBalance(dates, currentPage)
    const balanceTotalPromise = this.fetchBalanceTotal(dates)

    return Promise.all([
      recipientDataPromise,
      anticipationLimitPromise,
      balancePromise,
      balanceTotalPromise,
    ])
      .then(([
        recipientData,
        anticipationLimit,
        balance,
        total,
      ]) => {
        const { amount, error } = anticipationLimit
        this.setState({
          anticipationError: error,
          anticipationLimitAmount: amount,
          balance,
          loading: false,
          recipientData,
          total,
        })
      })
      .catch((pageError) => {
        this.setState({
          loading: false,
          pageError,
        })
      })
  }

  fetchRecipientData () {
    const { client, match } = this.props
    const { id } = match.params

    return client.recipient.detail(id)
      .then((recipient) => {
        const { identification } = recipient.informationData
        const accountsPromise = client.recipient.bankAccount(identification)
        return Promise.all([recipient, accountsPromise])
      })
      .then(([recipient, bankAccounts]) => {
        const { accounts } = bankAccounts
        const accountsPath = ['configurationData', 'accounts']
        const addAccounts = assocPath(accountsPath, accounts)
        const recipientData = addAccounts(recipient)
        return recipientData
      })
  }

  fetchAnticipationLimit () {
    const { client, match } = this.props
    const { id } = match.params
    return client.recipient.anticipationLimits(id)
      .then(limits => ({ amount: limits.maximum.amount, error: false }))
      .catch(error => ({ amount: 0, error }))
  }

  fetchBalance (dates, page) {
    const { selectedItemsPerPage } = this.state
    const { client, match } = this.props
    const { id } = match.params
    const query = {
      count: selectedItemsPerPage,
      dates,
      page,
      timeframe: 'future',
    }

    const getOperations = client.balance.operations({
      ...query,
      recipientId: id,
    })

    const getRecipientData = client.balance.data(id, query)

    return Promise.all([getOperations, getRecipientData])
      .then(([operations, data]) => ({
        ...data.result,
        search: {
          ...operations.result.search,
          query: operations.query,
        },
      }))
  }

  fetchBalanceTotal (dates) {
    const { client, match } = this.props
    const { id } = match.params
    const query = { dates }
    return client.balance.total(id, query)
  }

  sendToAnticipationPage () {
    const { history, match } = this.props
    const { id } = match.params
    history.push(`/anticipation/${id}`)
  }

  sendToWithdrawPage () {
    const { history, match } = this.props
    const { id } = match.params
    history.push(`/withdraw/${id}`)
  }

  render () {
    const {
      anticipationError,
      anticipationLimitAmount,
      balance,
      currentPage,
      dates,
      exporting,
      loading,
      pageError,
      recipientData,
      selectedItemsPerPage,
      showModal,
      total,
    } = this.state

    const { t } = this.props
    const { showSnackbar } = this.state

    const itemsPerPageOptions = itemsPerPage.map(i => ({
      name: t('items_per_page', { count: i }),
      value: `${i}`,
    }))

    if (loading) {
      return <Loader visible />
    }

    if (pageError) {
      const unknownErrorMessage = t('unknown_error')
      const errorMessagePath = ['response', 'errors', 0, 'message']
      const getErrorMessage = pathOr(unknownErrorMessage, errorMessagePath)
      const errorMessage = getErrorMessage(pageError)

      return (
        <Alert icon={<IconInfo height={16} width={16} />} type="info">
          <span>{errorMessage}</span>
        </Alert>
      )
    }

    const {
      companyData,
      configurationData,
      informationData,
    } = recipientData

    const { transferEnabled } = configurationData.transfer

    const anticipation = {
      automaticTransfer: transferEnabled,
      available: anticipationLimitAmount,
      error: anticipationError,
      loading,
    }

    return (
      <div className={style.relative}>
        {showSnackbar
        && (
        <Snackbar
          icon={<IconClose height={12} width={12} />}
          dismissTimeout={2500}
          onDismiss={this.handleCloseSnackbar}
          type="info"
        >
          <p>{t('pages.recipient_detail.configuration_changed')}</p>
        </Snackbar>
        )
        }
        <DetailRecipient
          informationProps={informationData}
          balanceProps={{
            ...balance,
            anticipation,
            currentPage,
            dates,
            disabled: loading,
            exporting,
            itemsPerPage: selectedItemsPerPage,
            loading,
            onAnticipationClick: this.sendToAnticipationPage,
            onCancelRequestClick: this.showCancelAnticipationModal,
            onExport: this.handleExportData,
            onFilterClick: this.handleDateFilter,
            onPageChange: this.handlePageChange,
            onPageCountChange: this.handlePageCountChange,
            onWithdrawClick: this.sendToWithdrawPage,
            pageSizeOptions: itemsPerPageOptions,
            total,
          }}
          configurationProps={{
            ...configurationData,
            handleSaveAnticipation: this.handleSaveAnticipation,
            handleSaveBankAccount: this.handleSaveBankAccount,
            handleSaveTransfer: this.handleSaveTransfer,
          }}
          exporting={exporting}
          recipient={companyData}
          t={t}
        />
        <ConfirmModal
          cancelText={t('cancel_pending_request_cancel')}
          confirmText={t('cancel_pending_request_confirm')}
          isOpen={showModal}
          onCancel={this.hideCancelAnticipationModal}
          onConfirm={this.handleAnticipationCancel}
          size="default"
          title={t('cancel_pending_request_title')}
        >
          <div style={style}>
            {t('cancel_pending_request_text')}
          </div>
        </ConfirmModal>
      </div>
    )
  }
}

DetailRecipientPage.propTypes = {
  client: PropTypes.shape({
    bulkAnticipations: PropTypes.shape({
      cancel: PropTypes.func.isRequired,
    }).isRequired,
    recipient: PropTypes.shape({
      add: PropTypes.func.isRequired,
      bankAccount: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  t: PropTypes.func.isRequired,
}

export default enhanced(DetailRecipientPage)

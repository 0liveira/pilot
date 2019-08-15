import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import qs from 'qs'

import {
  append,
  applySpec,
  compose,
  contains,
  defaultTo,
  either,
  flatten,
  identity,
  isEmpty,
  isNil,
  juxt,
  mergeAll,
  mergeRight,
  path,
  pipe,
  replace,
  tail,
  when,
  without,
} from 'ramda'

import {
  requestSearch,
  receiveSearch,
} from './actions'

import { requestLogout } from '../../Account/actions/actions'

import dateSelectorPresets from '../../../models/dateSelectorPresets'
import RecipientTable from '../../../containers/RecipientTable'

import { initialState } from './reducer'

const mapStateToProps = ({
  account: { client },
  recipients: { loading, query },
}) => ({ client, loading, query })

const mapDispatchToProps = ({
  onReceiveSearch: receiveSearch,
  onRequestSearch: requestSearch,
  onRequestSearchFail: requestLogout,
})

const enhanced = compose(
  translate(),
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withRouter
)

const normalizeTo = (defaultValue, propPath) => pipe(
  path(propPath),
  when(
    either(isNil, isEmpty),
    defaultTo(defaultValue)
  )
)

const normalizeQueryStructure = applySpec({
  count: pipe(normalizeTo(15, ['count']), Number),
  offset: pipe(normalizeTo(1, ['offset']), Number),
  search: normalizeTo('', ['search']),
})

const parseQueryUrl = pipe(
  tail,
  qs.parse,
  juxt([
    identity,
    normalizeQueryStructure,
  ]),
  mergeAll
)

const isRecipientId = (recipientText) => {
  const recipientPattern = /^(re_)(\w){25}/
  return recipientPattern.test(recipientText)
}

const isBankAccount = (bankAccount) => {
  if (bankAccount.length > 10) {
    return false
  }
  const bankNumber = Number.parseInt(bankAccount, 10)

  return Number.isInteger(bankNumber)
}

class RecipientsSearch extends React.Component {
  constructor (props) {
    super(props)

    const urlSearchQuery = props.history.location.search

    this.state = {
      clearFilterDisabled: false,
      confirmationDisabled: false,
      expandedRows: [],
      query: props.query || parseQueryUrl(urlSearchQuery),
      result: {
        chart: {
          dataset: [],
        },
        list: {
          rows: [],
        },
        total: {},
      },
      selectedRows: [],
    }

    this.handleExpandRow = this.handleExpandRow.bind(this)
    this.handleFilterChange = this.handleFilterChange.bind(this)
    this.handleFilterClear = this.handleFilterClear.bind(this)
    this.handleFilterConfirm = this.handleFilterConfirm.bind(this)
    this.handleOrderChange = this.handleOrderChange.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handlePageCountChange = this.handlePageCountChange.bind(this)
    this.handleRowClick = this.handleRowClick.bind(this)
    this.handleRowDetailsClick = this.handleRowDetailsClick.bind(this)
    this.handleSelectRow = this.handleSelectRow.bind(this)
    this.handleViewModeChange = this.handleViewModeChange.bind(this)

    this.requestData = this.requestData.bind(this)
  }

  componentDidMount () {
    const {
      history,
      query,
    } = this.props

    const urlSearchQuery = history.location.search
    if (isEmpty(urlSearchQuery)) {
      this.updateQuery(query)
    } else {
      this.requestData(parseQueryUrl(urlSearchQuery))
    }
  }

  updateQuery (query) {
    const {
      history: {
        location,
        push,
      },
    } = this.props

    const buildSearchQuery = qs.stringify

    const newQuery = buildSearchQuery(query)
    const currentQuery = replace('?', '', location.search)

    this.setState({
      expandedRows: [],
      selectedRows: [],
    })

    if (currentQuery !== newQuery) {
      push({
        pathname: 'recipients',
        search: newQuery,
      })

      this.requestData(query)
    }
  }

  requestData (query) {
    const {
      client,
      onReceiveSearch,
      onRequestSearch,
      onRequestSearchFail,
    } = this.props
    onRequestSearch({ query })

    const findByQuery = ({
      count,
      offset,
      search,
    }) => {
      let key = 'name'

      if (search) {
        if (isRecipientId(search)) {
          key = 'id'
        } else if (isBankAccount(search)) {
          key = 'bank_account_id'
        }
      }

      return client
        .recipients
        .find({
          count,
          [key]: search,
          page: offset,
        })
        .then(recipients => [recipients])
        .catch((error) => {
          onRequestSearchFail(error)
        })
    }

    const findByExternalId = ({
      count,
      offset,
      search,
    }) => {
      if (search
        && !isRecipientId(search)) {
        return client
          .recipients
          .find({
            count,
            external_id: search,
            page: offset,
          })
          .catch((error) => {
            onRequestSearchFail(error)
          })
      }

      return Promise.resolve([])
    }

    return Promise.all([
      findByExternalId(query),
      findByQuery(query),
    ])
      .then(res => flatten(res))
      .then((res) => {
        const result = {
          list: {
            rows: res,
          },
          total: {
            count: res.length,
            offset: query.offset,
          },
        }

        this.setState({
          result,
        })

        onReceiveSearch({
          query,
          rows: res,
        })
      })
      .catch((error) => {
        onRequestSearchFail(error)
      })
  }

  handlePageCountChange (count) {
    const { query } = this.props
    const newQuery = {
      ...query,
      count,
      offset: 1,
    }

    this.updateQuery(newQuery)
  }

  handleOrderChange () {
    const { query } = this.props
    const newQuery = {
      ...query,
      offset: 1,
    }

    this.updateQuery(newQuery)
  }

  handleFilterClear () {
    this.setState({
      clearFilterDisabled: true,
      confirmationDisabled: true,
      query: initialState.query,
    })

    this.updateQuery(initialState.query)
  }

  handleFilterChange (oldQuery) {
    const { query } = this.state
    const newQuery = mergeRight(query, oldQuery)

    this.setState({
      clearFilterDisabled: true,
      confirmationDisabled: false,
      query: newQuery,
    })
  }

  handleFilterConfirm ({
    filters,
    search,
  }) {
    const { query } = this.state
    const newQuery = {
      ...query,
      filters,
      offset: 1,
      search,
    }

    this.setState({
      clearFilterDisabled: false,
      confirmationDisabled: true,
    })

    this.updateQuery(newQuery)
  }

  handlePageChange (page) {
    const { query } = this.state
    const newQuery = {
      ...query,
      offset: page,
    }

    this.updateQuery(newQuery)
  }

  handleRowDetailsClick (row) {
    const { result } = this.state
    const recipient = result.list.rows[row]
    const { history } = this.props
    history.push(`/recipients/detail/${recipient.id}`)
  }

  handleRowClick (index) {
    const { expandedRows } = this.state
    this.setState({
      expandedRows: contains(index, expandedRows)
        ? without([index], expandedRows)
        : append(index, expandedRows),
    })
  }

  handleViewModeChange (viewMode) {
    this.setState({
      viewMode,
    })
  }

  handleExpandRow (expandedRows) {
    this.setState({
      expandedRows,
    })
  }

  handleSelectRow (selectedRows) {
    this.setState({
      selectedRows,
    })
  }

  render () {
    const {
      clearFilterDisabled,
      collapsed,
      columns,
      confirmationDisabled,
      expandedRows,
      result: {
        list,
      },
      selectedRows,
      viewMode,
    } = this.state

    const {
      history: {
        push,
      },
      loading,
      query,
      query: {
        count,
        offset,
      },
      t,
    } = this.props

    const pagination = {
      offset,
      total: list.rows.length === count
        ? 100
        : offset,
    }

    return (
      <RecipientTable
        amount={0}
        collapsed={collapsed}
        columns={columns}
        count={0}
        clearFilterDisabled={clearFilterDisabled}
        confirmationDisabled={confirmationDisabled}
        dateSelectorPresets={dateSelectorPresets}
        expandedRows={expandedRows}
        filterOptions={[]}
        loading={loading}
        push={push}
        onChangeViewMode={this.handleViewModeChange}
        onDetailsClick={this.handleRowDetailsClick}
        onExpandRow={this.handleExpandRow}
        onFilterChange={this.handleFilterChange}
        onFilterConfirm={this.handleFilterConfirm}
        onFilterClear={this.handleFilterClear}
        onOrderChange={this.handleOrderChange}
        onPageChange={this.handlePageChange}
        onPageCountChange={this.handlePageCountChange}
        onRowClick={this.handleRowClick}
        onSelectRow={this.handleSelectRow}
        pagination={pagination}
        rows={list.rows}
        selectedRows={selectedRows}
        query={query}
        viewMode={viewMode}
        t={t}
      />
    )
  }
}

RecipientsSearch.propTypes = {
  client: PropTypes.shape({
    recipients: PropTypes.shape({
      find: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  onReceiveSearch: PropTypes.func.isRequired,
  onRequestSearch: PropTypes.func.isRequired,
  onRequestSearchFail: PropTypes.func.isRequired,
  query: PropTypes.shape({
    count: PropTypes.number.isRequired,
    filters: PropTypes.shape({}),
    offset: PropTypes.number.isRequired,
    search: PropTypes.string,
  }).isRequired,
  t: PropTypes.func.isRequired,
}

export default enhanced(RecipientsSearch)

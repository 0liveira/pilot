import React, { lazy } from 'react'
import {
  Route,
  Switch,
} from 'react-router-dom'

import details from './Details'
import search from './Search'

const TransactionDetails = lazy(() => import(
  /* webpackChunkName: "transaction-details" */ './Details/Details'
))

const TransactionsSearch = lazy(() => import(
  /* webpackChunkName: "transactions" */ './Search/Search'
))

export const reducers = {
  details,
  search,
}

const TransactionsRouter = () => (
  <Switch>
    <Route
      component={TransactionDetails}
      exact
      path="/transactions/:id"
    />
    <Route
      path="/transactions"
      component={TransactionsSearch}
    />
  </Switch>
)

export default TransactionsRouter

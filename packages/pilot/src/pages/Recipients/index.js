import React, { lazy } from 'react'
import {
  Route,
  Switch,
} from 'react-router-dom'

import search from './Search'

const RecipientsSearch = lazy(() => import(
  /* webpackChunkName: "recipients" */ './Search/Search'
))

const RecipientDetail = lazy(() => import(
  /* webpackChunkName: "recipient-detail" */ './Detail'
))

const RecipientsAdd = lazy(() => import(
  /* webpackChunkName: "recipient-add" */ './Add'
))

export const reducers = {
  search,
}

const RecipientsRouter = () => (
  <Switch>
    <Route
      path="/recipients/detail/:id"
      component={RecipientDetail}
    />
    <Route
      path="/recipients/add"
      component={RecipientsAdd}
    />
    <Route
      path="/recipients"
      component={RecipientsSearch}
    />
  </Switch>
)

export default RecipientsRouter

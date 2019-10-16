import React, { Suspense } from 'react'
import PropTypes from 'prop-types'
import {
  Redirect,
  Route,
  Switch,
  withRouter,
} from 'react-router-dom'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  applySpec,
  compose,
  path,
} from 'ramda'
import { Layout } from 'former-kit'

import { ErrorBoundary } from '../ErrorBoundary'
import Sidebar from './Sidebar'
import Header from './Header'
import Loader from '../../components/Loader'

import env from '../../environment'
import routes from './routes'

// This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
// It was commented on to remove the anticipation limits call on Balance page
// This code will be used again in the future when ATLAS project implements the anticipation flow
// More details in issue #1159
// const getAnticipationLimit = path(['anticipation', 'limits', 'max'])
const getRecipientId = path(['account', 'company', 'default_recipient_id', env])
const getBalance = path(['account', 'balance'])
const getCompanyCapabilities = path(['account', 'company', 'capabilities'])
const getCompanyName = path(['account', 'company', 'name'])
const getAccountSessionId = path(['account', 'sessionId'])
const getTransfersPricing = path(['account', 'company', 'pricing', 'transfers'])

const mapStateToProps = applySpec({
  // This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
  // It was commented on to remove the anticipation limits call on Balance page
  // This code will be used again in the future when ATLAS project implements the anticipation flow
  // More details in issue #1159
  // anticipationLimit: getAnticipationLimit,
  balance: getBalance,
  companyCapabilities: getCompanyCapabilities,
  companyName: getCompanyName,
  recipientId: getRecipientId,
  sessionId: getAccountSessionId,
  transfersPricing: getTransfersPricing,
})

const enhanced = compose(
  translate(),
  withRouter,
  connect(mapStateToProps)
)

const LoggedArea = ({
  // This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
  // It was commented on to remove the anticipation limits call on Balance page
  // This code will be used again in the future when ATLAS project implements the anticipation flow
  // More details in issue #1159
  // anticipationLimit,
  balance,
  companyCapabilities,
  companyName,
  recipientId,
  sessionId,
  t,
  transfersPricing,
}) => (
  <Layout
    sidebar={(
      <Sidebar
        // This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
        // It was commented on to remove the anticipation limits call on Balance page
        // This code will be used again in the future when ATLAS project implements the anticipation flow
        // More details in issue #1159
        // anticipationLimit={anticipationLimit}
        companyCapabilities={companyCapabilities}
        companyName={companyName}
        balance={balance}
        recipientId={recipientId}
        sessionId={sessionId}
        t={t}
        transfersPricing={transfersPricing}
      />
    )}
    header={<Header t={t} />}
  >
    <ErrorBoundary>
      <Suspense
        fallback={(
          <Loader
            text={t('loading')}
            visible
          />
        )}
      >
        <Switch>
          {Object.values(routes).map(({ component, path: pathURI }) => (
            <Route
              key={pathURI}
              path={pathURI}
              component={component}
            />
          ))}
          <Redirect to="/home" />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  </Layout>
)

LoggedArea.propTypes = {
  // This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
  // It was commented on to remove the anticipation limits call on Balance page
  // This code will be used again in the future when ATLAS project implements the anticipation flow
  // More details in issue #1159
  // anticipationLimit: PropTypes.number,
  balance: PropTypes.shape({
    available: PropTypes.number,
  }),
  companyCapabilities: PropTypes.shape({
    allow_manage_recipient: PropTypes.bool,
  }),
  companyName: PropTypes.string,
  recipientId: PropTypes.string,
  sessionId: PropTypes.string,
  t: PropTypes.func.isRequired,
  transfersPricing: PropTypes.shape({
    ted: PropTypes.number,
  }),
}

LoggedArea.defaultProps = {
  // This block of code is commented because of issue #1159 (https://github.com/pagarme/pilot/issues/1159)
  // It was commented on to remove the anticipation limits call on Balance page
  // This code will be used again in the future when ATLAS project implements the anticipation flow
  // More details in issue #1159
  // anticipationLimit: null,
  balance: {},
  companyCapabilities: {},
  companyName: '',
  recipientId: null,
  sessionId: '',
  transfersPricing: {},
}

export default enhanced(LoggedArea)

import React, { Suspense, lazy } from 'react'
import PropTypes from 'prop-types'
import {
  Redirect,
  Route,
  Switch,
  withRouter,
} from 'react-router-dom'

import {
  compose,
  contains,
} from 'ramda'

import { translate } from 'react-i18next'

import Account from '../../containers/Account'
import Logo from '../../components/Logo'
import Presentation from './Presentation'
import TestLogo from '../../components/Logo/TestLogo'
import Loader from '../../components/Loader'

import environment from '../../environment'

const Login = lazy(() => import(
  /* webpackChunkName: "login" */ './Login'
))

const PasswordRecovery = lazy(() => import(
  /* webpackChunkName: "password-recovery" */ './PasswordRecovery/Request'
))

const PasswordRecoveryConfirmation = lazy(() => import(
  /* webpackChunkName: "password-recovery-confirmation" */ './PasswordRecovery/Request/Confirmation'
))

const PasswordReset = lazy(() => import(
  /* webpackChunkName: "password-reset" */ './PasswordRecovery/Reset'
))

const PasswordResetConfirmation = lazy(() => import(
  /* webpackChunkName: "password-reset-confirmation" */ './PasswordRecovery/Reset/Confirmation'
))

const CompanySignup = lazy(() => import(
  /* webpackChunkName: "company-signup" */ './SignUp/Company'
))

const CompanySignupConfirmation = lazy(() => import(
  /* webpackChunkName: "company-signup-confirmation" */ './SignUp/Company/Confirmation'
))

const UserSignUp = lazy(() => import(
  /* webpackChunkName: "user-signup" */ './SignUp/User'
))

const UserSignupConfirmation = lazy(() => import(
  /* webpackChunkName: "user-signup-confirmation" */ './SignUp/User/Confirmation'
))

const DARK_BASE = 'dark'
const LIGHT_BASE = 'light'

const getBaseByPath = (pathname) => {
  if (contains('account/login', pathname) && environment === 'live') {
    return LIGHT_BASE
  }
  return DARK_BASE
}

const getEnvironmentLogo = () => (
  environment === 'live'
    ? Logo
    : TestLogo
)

const enhance = compose(
  withRouter,
  translate()
)

const AccountArea = ({ history: { location }, t }) => {
  const base = getBaseByPath(location.pathname)
  return (
    <Suspense
      fallback={(
        <Loader
          text={t('loading')}
          visible
        />
      )}
    >
      <Account
        t={t}
        logo={getEnvironmentLogo()}
        base={base}
        primaryContent={(
          <Switch>
            <Route
              path="/account/login"
              render={() => <Login base={base} />}
            />
            <Route
              path="/account/password/recovery/confirmation"
              component={() => <PasswordRecoveryConfirmation />}
            />
            <Route
              path="/account/password/recovery"
              render={() => <PasswordRecovery base={base} />}
            />
            <Route
              path="/account/password/reset/confirmation"
              component={() => <PasswordResetConfirmation />}
            />
            <Route
              path="/account/password/reset/:token"
              render={() => <PasswordReset base={base} />}
            />
            <Route
              path="/account/signup/invite/confirmation"
              render={() => <UserSignupConfirmation />}
            />
            <Route
              path="/account/signup/invite"
              render={() => <UserSignUp base={base} />}
            />
            <Route
              path="/account/signup/confirmation"
              render={() => <CompanySignupConfirmation />}
            />
            <Route
              path="/account/signup"
              render={() => <CompanySignup base={base} />}
            />
            <Redirect to="/account/login" />
          </Switch>
        )}
        secondaryContent={(
          <Switch>
            <Route
              path="/account"
              component={Presentation}
            />
            <Redirect to="/account/login" />
          </Switch>
        )}
      />
    </Suspense>
  )
}

AccountArea.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }),
  }).isRequired,
  t: PropTypes.func.isRequired,
}

export default enhance(AccountArea)

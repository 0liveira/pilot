import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  CardActions,
  CardContent,
  Col,
  Grid,
  Row,
  Spacing,
} from 'former-kit'

import EditButton from './EditButton'
import ReceiverInfo from './ReceiverInfo'
import PartnerInfo from './PartnerInfo'
import styles from './style.css'
import bankCodes from '../../../models/banks'

import { accountProps, accountDefaultProps } from '../BankAccountStep'
import { virtualPageView } from '../../../vendor/googleTagManager'

import {
  BANK_ACCOUNT,
  CONFIGURATION,
  IDENTIFICATION,
} from '../stepIds'

const hasBankCode = code => !!bankCodes.find(bank => bank === code)

const renderPartnerInfo = (identification, action, t) => {
  if (identification.documentType === 'cpf') return null
  return (
    <Fragment>
      <Row>
        <Col>
          <span className={styles.title}>{t('pages.add_recipient.partner_data')}</span>
        </Col>
        <Col className={styles.editButtonCol}>
          <EditButton
            onClick={() => action(IDENTIFICATION)}
            t={t}
          />
        </Col>
      </Row>
      <PartnerInfo
        identification={identification}
        t={t}
      />
      <hr className={styles.line} />
    </Fragment>
  )
}

const renderReceiverInfo = (identification, action, t) => {
  const cpfTitle = t('pages.add_recipient.recipient_data')
  const cnpjTitle = t('pages.add_recipient.company_data')

  return (
    <Fragment>
      <Row>
        <Col>
          {identification.documentType === 'cpf'
          && <span className={styles.title}>{cpfTitle}</span>
          }
          {identification.documentType === 'cnpj'
          && <span className={styles.title}>{cnpjTitle}</span>
          }
        </Col>
        <Col className={styles.editButtonCol}>
          <EditButton
            onClick={() => action(IDENTIFICATION)}
            t={t}
          />
        </Col>
      </Row>
      <ReceiverInfo
        t={t}
        identification={identification}
      />
      <hr className={styles.line} />
    </Fragment>
  )
}

const renderBankAccount = (bankAccount, action, t) => (
  <Fragment>
    <Row>
      <Col>
        <span className={styles.title}>
          {t('pages.add_recipient.bank_account')}
        </span>
      </Col>
      <Col className={styles.editButtonCol}>
        <EditButton
          onClick={() => action(BANK_ACCOUNT)}
          t={t}
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <span className={styles.infoTitle}>
          {t('pages.add_recipient.account_name')}
        </span>
        <span className={styles.info}>
          {bankAccount.name}
        </span>
      </Col>
      <Col>
        <span className={styles.infoTitle}>
          {t('pages.add_recipient.bank')}
        </span>
        <span className={styles.info}>
          {hasBankCode(bankAccount.bank)
            ? t(`models.bank_code.${bankAccount.bank}`)
            : bankAccount.bank
          }
        </span>
      </Col>
      <Col>
        <span className={styles.infoTitle}>
          {t('pages.add_recipient.agency')}
        </span>
        <span className={styles.info}>
          {
            (bankAccount.agency_digit)
              ? `${bankAccount.agency}-${bankAccount.agency_digit}`
              : bankAccount.agency
          }
        </span>
      </Col>
      <Col>
        <span className={styles.infoTitle}>
          {t('pages.add_recipient.account')}
        </span>
        <span className={styles.info}>
          {`${bankAccount.number}-${bankAccount.number_digit}`}
        </span>
      </Col>
      <Col>
        <span className={styles.infoTitle}>
          {t('pages.add_recipient.account_type')}
        </span>
        <span className={styles.info}>
          {t(`models.account_type.${bankAccount.type}`)}
        </span>
      </Col>
    </Row>
    <hr className={styles.line} />
  </Fragment>
)

const renderAnticipationConfig = (configuration, action, t) => {
  const { anticipationModel } = configuration
  const anticipationTranslations = {
    automatic_1025: t('pages.add_recipient.automatic_1025'),
    automatic_dx: t('pages.add_recipient.automatic_dx'),
    automatic_volume: t('pages.add_recipient.automatic_volume'),
    manual: t('pages.add_recipient.manual_volume'),
  }
  const anticipationType = anticipationTranslations[anticipationModel]

  return (
    <Fragment>
      <Row>
        <Col>
          <span className={styles.title}>{t('pages.add_recipient.anticipation_configuration')}</span>
        </Col>
        <Col className={styles.editButtonCol}>
          <EditButton
            onClick={() => action(CONFIGURATION)}
            t={t}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <span className={styles.infoTitle}>
            {t('pages.add_recipient.anticipation_model')}
          </span>
          <span className={styles.info}>
            {anticipationType}
          </span>
        </Col>
        <Col>
          <span className={styles.infoTitle}>
            {t('pages.add_recipient.anticipation_volume_percentage')}
          </span>
          <span className={styles.info}>
            {configuration.anticipationVolumePercentage}
          </span>
        </Col>
      </Row>
      <hr className={styles.line} />
    </Fragment>
  )
}

const renderTransferInterval = (configuration, t) => {
  const {
    transferDay,
    transferEnabled,
    transferInterval,
  } = configuration

  const transferTypes = {
    daily: t('pages.add_recipient.daily'),
    monthly: t('pages.add_recipient.monthly'),
    weekly: t('pages.add_recipient.weekly'),
  }

  const weekDaysMap = {
    1: t('pages.add_recipient.monday'),
    2: t('pages.add_recipient.tuesday'),
    3: t('pages.add_recipient.wednesday'),
    4: t('pages.add_recipient.thursday'),
    5: t('pages.add_recipient.friday'),
  }

  if (transferEnabled) {
    return (
      <Fragment>
        <Col>
          <span className={styles.infoTitle}>
            {t('pages.add_recipient.automatic_transfer_interval')}
          </span>
          <span className={styles.info}>
            {transferTypes[transferInterval]}
          </span>
        </Col>
        { transferInterval !== 'daily'
        && (
          <Col>
            <span className={styles.infoTitle}>
              {t('pages.add_recipient.transfer_day')}
            </span>
            <span className={styles.info}>
              {
                (transferInterval === 'weekly')
                  ? weekDaysMap[transferDay]
                  : transferDay
              }
            </span>
          </Col>
        )}
      </Fragment>
    )
  }

  return null
}

const renderTransferConfig = (configuration, action, t) => {
  const enableTransfer = (configuration.transferEnabled)
    ? 'Habilitada'
    : ('Desabilitada')
  return (
    <Fragment>
      <Row>
        <Col>
          <span className={styles.title}>{t('pages.add_recipient.transfer_configuration')}</span>
        </Col>
        <Col className={styles.editButtonCol}>
          <EditButton
            onClick={() => action(CONFIGURATION)}
            t={t}
          />
        </Col>
      </Row>
      <Row>
        <Col tv={2} desk={2} tablet={2} palm={2}>
          <span className={styles.infoTitle}>{t('pages.add_recipient.automatic_transfer')}</span>
          <span className={styles.info}>{enableTransfer}</span>
        </Col>
        {renderTransferInterval(configuration, t)}
      </Row>
      <hr className={styles.line} />
    </Fragment>
  )
}

class ConfirmStep extends Component {
  componentDidMount () {
    virtualPageView({
      path: '/virtual/recipient/add/confirm',
      title: 'Add Recipient - Confirm',
    })
  }

  render () {
    const {
      data,
      onBack,
      onCancel,
      onContinue,
      onEdit,
      t,
    } = this.props

    return (
      <Fragment>
        <CardContent className={styles.paddingBottom}>
          <h3 className={styles.title}>{t('pages.add_recipient.confirm_recipient_registration')}</h3>
          <h4 className={styles.subtitle}>
            {t('pages.add_recipient.confirm_and_finish')}
          </h4>
          <Grid className={styles.paddingBottom}>
            <hr className={styles.line} />
            {renderReceiverInfo(data[IDENTIFICATION], onEdit, t)}
            {renderPartnerInfo(data[IDENTIFICATION], onEdit, t)}
            {renderBankAccount(data[BANK_ACCOUNT], onEdit, t)}
            {renderAnticipationConfig(data[CONFIGURATION], onEdit, t)}
            {renderTransferConfig(data[CONFIGURATION], onEdit, t)}
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            type="button"
            relevance="low"
            onClick={onCancel}
            fill="outline"
          >
            {t('pages.add_recipient.cancel')}
          </Button>
          <Spacing />
          <Button
            type="button"
            onClick={onBack}
            fill="outline"
          >
            {t('pages.add_recipient.back')}
          </Button>
          <Spacing size="medium" />
          <Button
            type="submit"
            fill="gradient"
            onClick={() => onContinue()}
          >
            {t('pages.add_recipient.create_recipient')}
          </Button>
        </CardActions>
      </Fragment>
    )
  }
}

const partnerPropTypes = PropTypes.shape({
  cpf: PropTypes.string,
  name: PropTypes.string,
  phone: PropTypes.string,
})

const partnerDefaultTypes = {
  cpf: '',
  name: '',
  phone: '',
}

ConfirmStep.propTypes = {
  data: PropTypes.shape({
    [BANK_ACCOUNT]: accountProps,
    [CONFIGURATION]: PropTypes.shape({
      anticipationDays: PropTypes.string,
      anticipationModel: PropTypes.string,
      anticipationVolumePercentage: PropTypes.string,
      transferDay: PropTypes.string,
      transferEnabled: PropTypes.bool,
      transferInterval: PropTypes.string,
    }).isRequired,
    [IDENTIFICATION]: PropTypes.shape({
      cnpj: PropTypes.string,
      cnpjEmail: PropTypes.string,
      cnpjInformation: PropTypes.bool,
      cnpjName: PropTypes.string,
      cnpjPhone: PropTypes.string,
      cnpjUrl: PropTypes.string,
      cpf: PropTypes.string,
      cpfEmail: PropTypes.string,
      cpfInformation: PropTypes.bool,
      cpfName: PropTypes.string,
      cpfPhone: PropTypes.string,
      cpfUrl: PropTypes.string,
      documentType: PropTypes.string,
      partner0: partnerPropTypes,
      partner1: partnerPropTypes,
      partner2: partnerPropTypes,
      partner3: partnerPropTypes,
      partner4: partnerPropTypes,
      partnerNumber: PropTypes.string,
    }).isRequired,
  }),
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
}

ConfirmStep.defaultProps = {
  data: {
    [BANK_ACCOUNT]: accountDefaultProps,
    [CONFIGURATION]: {
      anticipationDays: '',
      anticipationModel: '',
      anticipationVolumePercentage: '',
      transferDay: '',
      transferEnabled: false,
      transferInterval: '',
    },
    [IDENTIFICATION]: {
      cnpj: '',
      cnpjEmail: '',
      cnpjInformation: false,
      cnpjName: '',
      cnpjPhone: '',
      cnpjUrl: '',
      cpf: '',
      cpfEmail: '',
      cpfInformation: false,
      cpfName: '',
      cpfPhone: '',
      cpfUrl: '',
      documentType: '',
      partner0: partnerDefaultTypes,
      partner1: partnerDefaultTypes,
      partner2: partnerDefaultTypes,
      partner3: partnerDefaultTypes,
      partner4: partnerDefaultTypes,
      partnerNumber: '',
    },
  },
}

export default ConfirmStep

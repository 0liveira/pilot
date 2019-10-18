import {
  __,
  always,
  applySpec,
  complement,
  contains,
  curry,
  hasPath,
  ifElse,
  is,
  isNil,
  lensProp,
  map,
  mapObjIndexed,
  merge,
  omit,
  path,
  pathOr,
  pickBy,
  pipe,
  prop,
  propEq,
  set,
} from 'ramda'

const buildNewMetadata = ({ id, metadata }) => merge(
  { pagarme_original_transaction_id: id },
  metadata
)

const getCardId = ifElse(
  propEq('payment_method', 'credit_card'),
  path(['card', 'id']),
  always(null)
)

const getCustomerId = pathOr(null, ['customer', 'id'])

const hasCustomerDocuments = hasPath(['customer', 'documents', 0])

const buildCustomerObject = ({ address, phone, customer }) => ({
  address,
  phone,
  ...customer
})

const customerBuilder = ifElse(
  hasCustomerDocuments,
  applySpec({
    id: path(['customer', 'id'])
  }),
  buildCustomerObject
)

const hasCustomer = pipe(
  prop('customer'),
  complement(isNil)
)

const getCustomer = ifElse(
  hasCustomer,
  customerBuilder,
  always(null)
)

const ignoredProps = [
  'acquirer_id',
  'acquirer_name',
  'acquirer_response_code',
  'antifraud_score',
  'authorization_code',
  'authorized_amount',
  'boleto_barcode',
  'boleto_expiration_date',
  'boleto_url',
  'capture_method',
  'card_brand',
  'card_first_digits',
  'card_holder_name',
  'card_last_digits',
  'card_pin_mode',
  'cost',
  'date_created',
  'date_updated',
  'fraud_covered',
  'id',
  'local_time',
  'local_transaction_id',
  'nsu',
  'object',
  'paid_amount',
  'payment',
  'receipt_url',
  'refunded_amount',
  'refuse_reason',
  'risk_level',
  'soft_descriptor',
  'status_reason',
  'status',
  'tid',
]

const getBlacklist = (key) => {
  const blacklists = {
    customer: [],
    default: ['id', 'object'],
    items: ['object'],
  }

  return blacklists[key] || blacklists.default
}

const isValidProp = curry((value, key, fatherKey) => (
  !contains(key, getBlacklist(fatherKey)) && value !== null
))

const cleanupProps = (object, key) => {
  if (is(Array, object)) {
    return map(o => cleanupProps(o, key), object)
  }

  if (is(Object, object)) {
    return pickBy(isValidProp(__, __, key), mapObjIndexed(cleanupProps, object))
  }

  return object
}

const removeIgnoredProps = pipe(
  omit(ignoredProps),
  cleanupProps
)

const cardIdLens = lensProp('card_id')

const customerIdLens = lensProp('customer_id')

const customerLens = lensProp('customer')

const metadataLens = lensProp('metadata')

const setCardId = transaction => (
  set(cardIdLens, getCardId(transaction), transaction)
)

const setCustomerId = transaction => (
  set(customerIdLens, getCustomerId(transaction), transaction)
)

const setMetadata = transaction => (
  set(metadataLens, buildNewMetadata(transaction), transaction)
)

const setCustomer = transaction => (
  set(customerLens, getCustomer(transaction), transaction)
)

export default pipe(
  setCardId,
  setCustomerId,
  setMetadata,
  setCustomer,
  removeIgnoredProps
)

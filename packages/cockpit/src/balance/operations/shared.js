import {
  __,
  always,
  applySpec,
  ascend,
  assoc,
  both,
  cond,
  either,
  evolve,
  equals,
  has,
  ifElse,
  isEmpty,
  isNil,
  juxt,
  lt,
  map,
  negate,
  path,
  pathEq,
  pathOr,
  pipe,
  pluck,
  prop,
  propEq,
  propSatisfies,
  sortWith,
  sum,
  T,
  when,
  unless,
} from 'ramda'

const negateWhenNotZero = unless(
  equals(0),
  negate
)

export const transformMovementTypePropTo = (propPath, to) => pipe(
  path(propPath),
  when(either(isNil, isEmpty), always(0)),
  assoc('amount', __, { type: to })
)

export const transformAndNegateMovementTypePropTo = (propPath, to) => pipe(
  transformMovementTypePropTo(propPath, to),
  evolve({ amount: negateWhenNotZero })
)

const lessThanZero = lt(__, 0)

export const isNegative = propSatisfies(lessThanZero)

export const buildNetAmount = (buildOutcoming, buildOutgoing) => pipe(
  juxt([
    pipe(buildOutcoming, pluck('amount'), sum),
    pipe(buildOutgoing, pluck('amount'), sum),
  ]),
  sum
)

const isNilProp = type => propSatisfies(isNil, type)

export const getOperationDate = (dateType, fallbackDateType) => pipe(
  when(has('movement_object'), prop('movement_object')),
  ifElse(
    isNilProp(dateType),
    prop(fallbackDateType),
    prop(dateType)
  ),
  when(
    either(isNil, isEmpty),
    always(null)
  )
)

export const getSourceId = ifElse(
  pathEq(['movement_object', 'type'], 'inter_recipient'),
  path(['movement_object', 'source_id']),
  always(null)
)

export const getTargetId = ifElse(
  pathEq(['movement_object', 'type'], 'inter_recipient'),
  path(['movement_object', 'target_id']),
  always(null)
)

export const getTransactionId = ifElse(
  propEq('object', 'balance_operation'),
  pathOr(null, ['movement_object', 'transaction_id']),
  prop('transaction_id')
)

export const getType = cond([
  [
    propEq('object', 'payable'),
    prop('payment_method'),
  ],
  [
    both(
      propEq('type', 'refund'),
      pathEq(['movement_object', 'type'], 'boleto')
    ),
    always('boletoRefundFee'),
  ],
  [
    pathEq(['movement_object', 'type'], 'credit'),
    path(['movement_object', 'payment_method']),
  ],
  [T, path(['movement_object', 'type'])],
])

export const formatRows = ({
  buildOutcoming,
  buildOutgoing,
  getInstallment,
}) => pipe(
  map(applySpec({
    id: prop('id'),
    installment: getInstallment,
    net: buildNetAmount(buildOutcoming, buildOutgoing),
    outcoming: buildOutcoming,
    outgoing: buildOutgoing,
    paymentDate: {
      actual: getOperationDate('payment_date', 'date_created'),
      original: getOperationDate('original_payment_date'),
    },
    sourceId: getSourceId,
    targetId: getTargetId,
    type: getType,
    transactionId: getTransactionId,
  })),
  sortWith([
    ascend(prop('id')),
    ascend(path(['paymentDate', 'actual'])),
  ])
)

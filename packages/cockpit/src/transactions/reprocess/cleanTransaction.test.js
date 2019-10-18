import {
  assoc,
  assocPath,
  dissoc,
  dissocPath,
  pipe,
  omit,
} from 'ramda'
import cleanTransaction from './cleanTransaction'
import fromRequest from './mocks/fromRequest.json'
import toRequest from './mocks/toRequest.json'

const createCustomerObject = ({ address, customer, phone }) => ({
  address,
  phone,
  ...customer,
})

const removePhoneUnusedProps = pipe(
  dissocPath(['phone', 'id']),
  dissocPath(['phone', 'object'])
)

const removeUnusedCustomerProps = pipe(
  omit([
    'born_at',
    'document_number',
    'gender',
  ]),
  removePhoneUnusedProps
)

const addDcoumentsProp = assoc('documents', [])

const buildCustomerObject = pipe(
  createCustomerObject,
  removeUnusedCustomerProps,
  addDcoumentsProp
)

describe('Reprocess', () => {
  it('should work', () => {
    expect(cleanTransaction(fromRequest)).toEqual(toRequest)
  })

  it('should work when customer is null', () => {
    const withoutCustomer = assoc('customer', null, fromRequest)
    const toRequestWithourCustomer = pipe(
      dissoc('customer'),
      dissoc('customer_id')
    )(toRequest)

    expect(cleanTransaction(withoutCustomer)).toEqual(toRequestWithourCustomer)
  })

  it('should work when documents is empty', () => {
    const withoutCustomer = assocPath(['customer', 'documents'], [], fromRequest)

    const customerObject = buildCustomerObject(fromRequest)
    const toRequestExpected = assoc('customer', customerObject, toRequest)

    expect(cleanTransaction(withoutCustomer)).toEqual(toRequestExpected)
  })
})

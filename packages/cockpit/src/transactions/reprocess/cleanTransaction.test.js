import {
  assoc,
  assocPath,
  dissoc,
  dissocPath,
  pipe,
} from 'ramda'
import cleanTransaction from './cleanTransaction'
import fromRequest from './mocks/fromRequest.json'
import toRequest from './mocks/toRequest.json'

const buildCustomerObject = ({ address, phone, customer }) => ({
  address,
  phone,
  ...customer,
})

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

    const toRequestExpected = pipe(
      assoc('customer', customerObject),
      assocPath(['customer', 'documents'], []),
      dissocPath(['customer', 'born_at']),
      dissocPath(['customer', 'document_number']),
      dissocPath(['customer', 'gender']),
      dissocPath(['customer', 'phone', 'id']),
      dissocPath(['customer', 'phone', 'object']),
    )(toRequest)

    expect(cleanTransaction(withoutCustomer)).toEqual(toRequestExpected)
  })
})

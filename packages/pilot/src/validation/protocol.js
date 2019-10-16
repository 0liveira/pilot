import isUrl from 'validator/lib/isURL'

const options = {
  protocols: ['http', 'https'],
  require_protocol: false,
}

export default message => value => (!value || !isUrl(value, options)) && message

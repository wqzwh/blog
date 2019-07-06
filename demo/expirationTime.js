const UNIT_SIZE = 10
const MAX_SIGNED_31_BIT_INT = 1073741823
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1

function msToExpirationTime(ms) {
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0)
}

const LOW_PRIORITY_EXPIRATION = 5000
const LOW_PRIORITY_BATCH_SIZE = 250

function computeAsyncExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE
  )
}

const HIGH_PRIORITY_EXPIRATION = 500
const HIGH_PRIORITY_BATCH_SIZE = 100

function computeInteractiveExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE
  )
}

function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  )
}

const getExpirationTime = () => {
  const currentTime = msToExpirationTime(performance.now())
  return computeAsyncExpiration(currentTime)
}

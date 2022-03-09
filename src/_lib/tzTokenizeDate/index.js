/**
 * Returns the [year, month, day, hour, minute, seconds] tokens of the provided
 * `date` as it will be rendered in the `timeZone`.
 */
export default function tzTokenizeDate(date, timeZone) {
  var dtf = getDateTimeFormat(timeZone)
  try {
    return dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date)
  } catch (error) {
    if (error instanceof RangeError) {
      return [NaN]
    }
    throw error
  }
}

var typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5,
  fractionalSecond: 6,
}

function partsOffset(dtf, date) {
  var formatted = dtf.formatToParts(date)
  var filled = []
  var era = 'A'
  var year = 0
  for (var i = 0; i < formatted.length; i++) {
    var part = formatted[i]
    var type = part.type
    switch (type) {
      case 'era':
        era = part.value
        break
      case 'year':
        year = parseInt(part.value, 10)
        break
      case 'literal':
        break
      default:
        filled[typeToPos[type]] = parseInt(part.value, 10)
        break
    }
  }
  filled[typeToPos['year']] = formattedEraYearToYearValue(era, year)
  return filled
}

function formattedEraYearToYearValue(era, year) {
  switch (era) {
    case 'A':
      return year
    default:
      // 'B'
      return 1 - year
  }
}

function hackyOffset(dtf, date) {
  var formatted = dtf.format(date).replace(/\u200E/g, '')
  var parsed = /(\d+)\/(\d+)\/(\d+) ([AB]),? (\d+):(\d+):(\d+)\.(\d+)/.exec(formatted)
  var yearValue = formattedEraYearToYearValue(parsed[4], parsed[3])
  return [yearValue, parsed[1], parsed[2], parsed[5], parsed[6], parsed[7], parsed[8]]
}

// Get a cached Intl.DateTimeFormat instance for the IANA `timeZone`. This can be used
// to get deterministic local date/time output according to the `en-US` locale which
// can be used to extract local time parts as necessary.
var dtfCache = {}
function getDateTimeFormat(timeZone) {
  if (!dtfCache[timeZone]) {
    // New browsers use `hourCycle`, IE and Chrome <73 does not support it and uses `hour12`
    var testDateFormatted = new Intl.DateTimeFormat('en-US', {
      hour12: false,
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date('2014-06-25T04:00:00.123Z'))
    var hourCycleSupported =
      testDateFormatted === '06/25/2014, 00:00:00' ||
      testDateFormatted === '‎06‎/‎25‎/‎2014‎ ‎00‎:‎00‎:‎00'

    dtfCache[timeZone] = hourCycleSupported
      ? new Intl.DateTimeFormat('en-US', {
          hour12: false,
          timeZone: timeZone,
          era: 'narrow',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        })
      : new Intl.DateTimeFormat('en-US', {
          hourCycle: 'h23',
          timeZone: timeZone,
          era: 'narrow',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        })
  }
  return dtfCache[timeZone]
}

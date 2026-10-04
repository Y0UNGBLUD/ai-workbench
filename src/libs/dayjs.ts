import dayjs from 'dayjs'

import 'dayjs/locale/ko'

import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'

// plugins
dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(localizedFormat)

// locale
dayjs.locale('ko')

export default dayjs

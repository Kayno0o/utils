import { cronExpressionExplainer, cronMatches, cronNextRuns, cronPreviousRuns } from '../src/cron'

// Schedule with a command.
console.log(cronExpressionExplainer('0 * * * 0 /bin/bash'))
// {
//   expression: '0 * * * 0',
//   command: '/bin/bash',
//   description: 'Minute 0, on Sunday, running `/bin/bash`',
//   nextRuns: [ ...5 dates ],
// }

// Schedule only.
console.log(cronExpressionExplainer('0 * * * 0'))

// Steps, ranges, lists and month/weekday aliases.
console.log(cronExpressionExplainer('*/15 9-17 * * mon-fri').description)
// 'Every 15 minutes, at hour 9 through 17, on Monday through Friday'

// Leap-year aware: Feb 29th only fires on leap years.
console.log(cronExpressionExplainer('0 0 29 2 *', { count: 2 }).nextRuns)

// Control the number of runs and the reference date.
console.log(cronExpressionExplainer('0 0 1 * *', { count: 3, from: new Date(2026, 0, 15) }).nextRuns)

// Upcoming and past runs as plain Date arrays (a trailing command is ignored).
console.log(cronNextRuns('0 0 * * *', { count: 3 }))
console.log(cronPreviousRuns('0 0 1 * *', { count: 3, from: new Date(2026, 2, 15) }))

// Does a given date satisfy the expression? (minute granularity)
console.log(cronMatches(new Date(2026, 5, 14, 0, 0), '0 * * * 0')) // true (Sunday, minute 0)
console.log(cronMatches(new Date(2026, 5, 13, 0, 0), '0 * * * 0')) // false (Saturday)

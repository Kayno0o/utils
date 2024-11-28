import { getRandomElement } from './arrayUtils'
import { getDaysInMonth } from './dateUtils'
import { randomInt } from './numberUtils'
import { firstUpper } from './textUtils'

export function faker() {
  const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah']
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']
  const LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'proin', 'ultricies', 'sed', 'dui', 'scelerisque', 'donec', 'pellentesque', 'diam', 'vel', 'ligula', 'efficitur']

  function fakeYear({
    endYear = new Date().getFullYear() + 4,
    startYear = new Date().getFullYear() - 4,
  }: {
    endYear?: number
    startYear?: number
  } = {}): string {
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
    return year.toString()
  }

  function fakeMonth(): string {
    const month = Math.floor(Math.random() * 12) + 1
    return month.toString().padStart(2, '0')
  }

  function fakeDate({
    endYear = new Date().getFullYear() + 4,
    startYear = new Date().getFullYear() - 4,
  }: {
    endYear?: number
    startYear?: number
  } = {}): string {
    const year = Number(fakeYear({ endYear, startYear }))
    const month = Number(fakeMonth())
    const daysInMonth = getDaysInMonth(year, month)

    const day = Math.floor(Math.random() * daysInMonth) + 1
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  function fakeFullName() {
    const randomFirstName = getRandomElement(FIRST_NAMES)
    const randomLastName = getRandomElement(LAST_NAMES)

    return `${randomFirstName} ${randomLastName}`
  }

  function fakeWord(isCrypto = false, length = 1, words = LOREM_WORDS): string {
    length = Math.max(1, length)
    return Array.from({ length }, () => getRandomElement(words, isCrypto)).join(' ')
  }

  function fakeSentence(isCrypto = false, length = 1, words = LOREM_WORDS): string {
    return Array.from({ length }, () => {
      const count = randomInt(5, 15, isCrypto)
      let sentence = fakeWord(isCrypto, 1, words)

      for (let i = 1; i < count; i++) {
        sentence += (i < count - 1 && Math.random() < 0.1)
          ? ` ${fakeWord(isCrypto, 1, words)},`
          : ` ${fakeWord(isCrypto, 1, words)}`
      }

      return `${firstUpper(sentence)}.`
    }).join('\n')
  }

  function fakeParagraph(isCrypto = false, length = 1, words = LOREM_WORDS): string {
    return Array.from({ length }, () => {
      const count = randomInt(3, 7, isCrypto)
      let paragraph = fakeSentence(isCrypto, 1, words)

      for (let i = 1; i < count; i++) {
        paragraph += ` ${fakeSentence(isCrypto, 1, words)}`
      }

      return paragraph
    }).join('\n')
  }

  function fakeText({ isCrypto = false, length = 5, type = 'paragraph' }: {
    isCrypto?: boolean
    length?: number
    type?: 'word' | 'sentence' | 'paragraph'
  } = {}, words = LOREM_WORDS): string {
    length = Math.max(1, length)

    switch (type) {
      case 'word': return fakeWord(isCrypto, length, words)
      case 'sentence': return fakeSentence(isCrypto, length, words)
      case 'paragraph': default: return fakeParagraph(isCrypto, length, words)
    }
  }

  return {
    date: fakeDate,
    fullName: fakeFullName,
    month: fakeMonth,
    text: fakeText,
    year: fakeYear,
  }
}

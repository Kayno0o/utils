import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { createBoard, cryptoRandom, sample, sfc32, shuffle } from '../src'

describe('sample', () => {
  it('returns n items without replacement', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = sample(arr, 3)

    expect(result).toHaveLength(3)
    expect(new Set(result).size).toBe(3)
    for (const x of result)
      expect(arr).toContain(x)
  })

  it('clamps n above array length', () => {
    expect(sample([1, 2], 10)).toHaveLength(2)
  })

  it('clamps n below 0', () => {
    expect(sample([1, 2, 3], -1)).toHaveLength(0)
  })

  it('does not mutate the source array', () => {
    const arr = [1, 2, 3]

    sample(arr, 2)
    expect(arr).toEqual([1, 2, 3])
  })

  it('returns all items when n equals length', () => {
    const arr = [1, 2, 3]
    const result = sample(arr, 3)

    expect(result.sort()).toEqual([1, 2, 3])
  })
})

describe('createBoard', () => {
  it('creates a rows × cols grid filled with a value', () => {
    const board = createBoard(2, 3, 0)

    expect(board).toHaveLength(2)
    expect(board[0]).toHaveLength(3)
    expect(board.flat()).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('uses a factory function with (row, col) args', () => {
    const board = createBoard(2, 2, (r, c) => `${r},${c}`)

    expect(board).toEqual([['0,0', '0,1'], ['1,0', '1,1']])
  })

  it('creates independent row arrays (no shared references)', () => {
    const board = createBoard(3, 3, 0)

    board[0]![0] = 99
    expect(board[1]![0]).toBe(0)
    expect(board[2]![0]).toBe(0)
  })

  it('handles 0×0', () => {
    expect(createBoard(0, 0, null)).toEqual([])
  })
})

describe('seeded source in shuffle and sample', () => {
  it('shuffles identically for identical seeds, keeping the items', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8]
    const b = [...a]

    const shuffledA = shuffle(a, sfc32(1, 2, 3, 4))
    const shuffledB = shuffle(b, sfc32(1, 2, 3, 4))

    expect(shuffledA).toEqual(shuffledB)
    expect(shuffledA.toSorted((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('samples identically for identical seeds', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]

    expect(sample(items, 4, sfc32(5, 6, 7, 8))).toEqual(sample(items, 4, sfc32(5, 6, 7, 8)))
  })

  it('shuffle with a constant 0 source rotates left', () => {
    const items = [1, 2, 3]

    expect(shuffle(items, () => 0)).toEqual([2, 3, 1])
    expect(items).toEqual([1, 2, 3])
  })
})

describe('crypto randomness in shuffle and sample', () => {
  afterEach(() => {
    spyOn(Math, 'random').mockRestore()
    spyOn(crypto, 'getRandomValues').mockRestore()
  })

  it('draws from crypto.getRandomValues instead of Math.random with cryptoRandom', () => {
    const mathRandom = spyOn(Math, 'random')
    const cryptoSpy = spyOn(crypto, 'getRandomValues')
    const arr = [1, 2, 3, 4, 5]

    expect(shuffle(arr, cryptoRandom).toSorted()).toEqual([1, 2, 3, 4, 5])
    expect(sample(arr, 3, cryptoRandom)).toHaveLength(3)

    expect(mathRandom).not.toHaveBeenCalled()
    expect(cryptoSpy).toHaveBeenCalledTimes(4 + 3)
  })

  it('uses Math.random by default', () => {
    const mathRandom = spyOn(Math, 'random')

    shuffle([1, 2, 3])
    sample([1, 2, 3], 2)

    expect(mathRandom).toHaveBeenCalledTimes(2 + 2)
  })
})

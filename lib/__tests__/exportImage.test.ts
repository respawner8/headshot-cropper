import { validateCrop } from '../exportImage'

describe('validateCrop', () => {
  it('returns true for valid crop', () => {
    expect(validateCrop({ x: 10, y: 10, width: 100, height: 133 })).toBe(true)
  })

  it('returns false for zero width', () => {
    expect(validateCrop({ x: 0, y: 0, width: 0, height: 100 })).toBe(false)
  })

  it('returns false for zero height', () => {
    expect(validateCrop({ x: 0, y: 0, width: 100, height: 0 })).toBe(false)
  })

  it('returns false for negative dimensions', () => {
    expect(validateCrop({ x: 0, y: 0, width: -10, height: 100 })).toBe(false)
  })
})

import { heuristicCrop } from '../suggestCrop'

describe('heuristicCrop', () => {
  it('returns a crop with 3:4 aspect ratio', () => {
    const crop = heuristicCrop(1000, 1200)
    expect(crop.width / crop.height).toBeCloseTo(3 / 4, 2)
  })

  it('centers the crop horizontally', () => {
    const crop = heuristicCrop(1000, 1200)
    const leftMargin = crop.x
    const rightMargin = 1000 - (crop.x + crop.width)
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(2)
  })

  it('places the crop in the upper third vertically', () => {
    const crop = heuristicCrop(1000, 1200)
    expect(crop.y).toBeLessThanOrEqual(1200 / 3)
  })

  it('keeps the crop within image bounds', () => {
    const crop = heuristicCrop(800, 600)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(800)
    expect(crop.y + crop.height).toBeLessThanOrEqual(600)
  })

  it('handles portrait image correctly', () => {
    const crop = heuristicCrop(400, 800)
    expect(crop.width).toBeGreaterThan(0)
    expect(crop.height).toBeGreaterThan(0)
  })

  it('handles landscape image correctly', () => {
    const crop = heuristicCrop(1200, 600)
    expect(crop.width).toBeGreaterThan(0)
    expect(crop.height).toBeGreaterThan(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(1200)
    expect(crop.y + crop.height).toBeLessThanOrEqual(600)
  })
})

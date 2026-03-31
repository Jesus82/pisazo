import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PriceTrend from '../Chart/PriceTrend.vue'
import type { PriceSnapshot } from '~/types/price'

vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    template: '<div data-testid="echarts" />',
    props: ['option', 'autoresize'],
  },
}))

const mockHistory: PriceSnapshot[] = [
  { id: 1, listingId: 'ABC', date: '2026-03-01', price: 290000, priceM2: 3036 },
  { id: 2, listingId: 'ABC', date: '2026-03-15', price: 285000, priceM2: 2984 },
  { id: 3, listingId: 'ABC', date: '2026-03-30', price: 280000, priceM2: 2931 },
]

describe('PriceTrend', () => {
  it('renders the chart', async () => {
    const wrapper = await mountSuspended(PriceTrend, {
      props: { priceHistory: mockHistory },
    })

    expect(wrapper.find('[data-testid="echarts"]').exists()).toBe(true)
  })

  it('renders with single data point', async () => {
    const wrapper = await mountSuspended(PriceTrend, {
      props: { priceHistory: [mockHistory[0]] },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders with empty history', async () => {
    const wrapper = await mountSuspended(PriceTrend, {
      props: { priceHistory: [] },
    })

    expect(wrapper.exists()).toBe(true)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import NotariadoBarChart from '../Chart/NotariadoBarChart.vue'
import type { NotariadoStat } from '~/types/notariado'

// Mock ECharts — it requires a DOM canvas
vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    template: '<div data-testid="echarts" />',
    props: ['option', 'autoresize'],
  },
}))

const mockData: { name: string; stat: NotariadoStat }[] = [
  {
    name: 'Ensanche - Juan Flórez',
    stat: {
      id: 1,
      zoneId: 1,
      month: '2026-01',
      avgPriceM2: 3307,
      avgTotalPrice: 245000,
      avgSurfaceM2: 85,
      numTransactions: 137,
      pctForeignBuyers: 4.5,
    },
  },
  {
    name: 'Os Mallos',
    stat: {
      id: 2,
      zoneId: 4,
      month: '2026-01',
      avgPriceM2: 2160,
      avgTotalPrice: 180000,
      avgSurfaceM2: 80,
      numTransactions: 293,
      pctForeignBuyers: 3.2,
    },
  },
]

describe('NotariadoBarChart', () => {
  it('renders the chart component', async () => {
    const wrapper = await mountSuspended(NotariadoBarChart, {
      props: { data: mockData },
    })

    expect(wrapper.find('[data-testid="echarts"]').exists()).toBe(true)
  })

  it('renders with empty data without crashing', async () => {
    const wrapper = await mountSuspended(NotariadoBarChart, {
      props: { data: [] },
    })

    expect(wrapper.exists()).toBe(true)
  })
})

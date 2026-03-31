<script setup lang="ts">
import type { PriceSnapshot } from '~/types/price'

const props = defineProps<{
  priceHistory: PriceSnapshot[]
  title?: string
}>()

const option = computed(() => {
  const data = props.priceHistory.filter(p => p.price !== null)

  return {
    title: props.title ? { text: props.title, left: 'center', textStyle: { fontSize: 14 } } : undefined,
    tooltip: {
      trigger: 'axis',
      formatter(params: any) {
        const p = params[0]
        return `${p.axisValue}<br/>€${p.value.toLocaleString('es-ES')}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(p => p.date),
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '€',
      axisLabel: {
        formatter: (v: number) => `€${(v / 1000).toFixed(0)}k`,
      },
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
    ],
    series: [{
      name: 'Precio',
      type: 'line',
      data: data.map(p => p.price),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#3579a8' },
      itemStyle: { color: '#3579a8' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(53, 121, 168, 0.25)' },
            { offset: 1, color: 'rgba(53, 121, 168, 0.02)' },
          ],
        },
      },
    }],
  }
})
</script>

<template>
  <ClientOnly>
    <VChart :option="option" autoresize style="height: 300px;" />
    <template #fallback>
      <div class="chart-placeholder" style="height: 300px; display: flex; align-items: center; justify-content: center; background: var(--gris-2); border-radius: var(--border-radius-lg);">
        <p style="color: var(--gris-40); font-size: var(--font-size-sm);">Cargando gráfica...</p>
      </div>
    </template>
  </ClientOnly>
</template>

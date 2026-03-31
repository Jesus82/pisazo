<script setup lang="ts">
import type { NotariadoStat } from '~/types/notariado'

interface ZoneNotariado {
  name: string
  stat: NotariadoStat
}

const props = defineProps<{
  data: ZoneNotariado[]
}>()

const option = computed(() => {
  const sorted = [...props.data].sort((a, b) => (b.stat.avgPriceM2 ?? 0) - (a.stat.avgPriceM2 ?? 0))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params: any) {
        const p = params[0]
        const zone = sorted[p.dataIndex]
        return `
          <strong>${zone.name}</strong><br/>
          ${p.value.toLocaleString('es-ES')} €/m²<br/>
          Precio medio: ${zone.stat.avgTotalPrice?.toLocaleString('es-ES')} €<br/>
          Superficie: ${zone.stat.avgSurfaceM2} m²<br/>
          Transacciones: ${zone.stat.numTransactions}
        `
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sorted.map(z => z.name),
      axisLabel: {
        rotate: 35,
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: '€/m²',
      axisLabel: {
        formatter: (v: number) => v.toLocaleString('es-ES'),
      },
    },
    series: [{
      name: 'Precio real (Notariado)',
      type: 'bar',
      data: sorted.map(z => z.stat.avgPriceM2 ?? 0),
      itemStyle: {
        color: '#3579a8',
        borderRadius: [4, 4, 0, 0],
      },
      barMaxWidth: 50,
    }],
  }
})
</script>

<template>
  <ClientOnly>
    <VChart :option="option" autoresize style="height: 350px;" />
  </ClientOnly>
</template>

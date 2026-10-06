<script setup lang="ts">
import { ref } from 'vue'
import { C, useRoughScene } from '../utils/rough-scene'

// Decorative cover sketch: a request hopping across services, carrying its context.
const svg = ref<SVGSVGElement>()

const nodes: [number, number, string][] = [
  [60, 70, 'web'],
  [230, 40, 'api'],
  [390, 120, 'cart'],
  [230, 220, 'auth'],
  [400, 290, 'pay'],
]
const edges: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4]]

useRoughScene(svg, (s) => {
  s.base = { stroke: C.white, strokeWidth: 2 }
  nodes.forEach(([x, y, label], i) => {
    const g = s.layer(0, { delay: 250 + i * 260, duration: 600 })
    s.circle(g, x, y, 62, { fill: C.blue, fillStyle: 'solid', stroke: C.white })
    s.text(g, x, y + 1, label, { anchor: 'middle', color: C.white, weight: 700, size: 15 })
  })
  edges.forEach(([a, b], i) => {
    const g = s.layer(0, { delay: 450 + i * 260, duration: 500 })
    const [x1, y1] = nodes[a]
    const [x2, y2] = nodes[b]
    const d = Math.hypot(x2 - x1, y2 - y1)
    const ux = (x2 - x1) / d
    const uy = (y2 - y1) / d
    s.arrow(g, x1 + ux * 36, y1 + uy * 36, x2 - ux * 38, y2 - uy * 38, { stroke: C.orange, strokeWidth: 2.4 })
  })
  const g = s.layer(0, { delay: 1800, duration: 700 })
  s.text(g, 40, 318, 'one trace id, every hop', { color: C.white, size: 15, weight: 600 })
  s.pill(g, 40, 335, 210, 32, 'trace 4bf92f35…', C.orange, C.navy, 14)
}, () => 0)
</script>

<template>
  <svg ref="svg" viewBox="0 0 480 400" class="w-full h-full" />
</template>

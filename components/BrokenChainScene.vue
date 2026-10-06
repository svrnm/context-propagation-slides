<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// What happens when a hop drops the headers: the trace silently splits in two.
const svg = ref<SVGSVGElement>()

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.box(g0, 20, 40, 170, 70, 'web', { stroke: C.blue, strokeWidth: 2.5 }, { color: C.navy, size: 20 })
  s.box(g0, 365, 40, 170, 70, 'legacy proxy', { stroke: C.grey, strokeWidth: 2.5, fill: C.greyLight, fillStyle: 'hachure', hachureGap: 8 }, { color: C.ink, size: 19 })
  s.box(g0, 710, 40, 170, 70, 'orders', { stroke: C.blue, strokeWidth: 2.5 }, { color: C.navy, size: 20 })
  s.arrow(g0, 195, 75, 358, 75, { stroke: C.ink, strokeWidth: 2 })
  s.arrow(g0, 540, 75, 703, 75, { stroke: C.ink, strokeWidth: 2 })

  // 1 · header travels to the proxy
  const g1 = s.layer(1, { to: 1 })
  s.envelope(g1, 250, 120, 56, 38, { stroke: C.orangeDark, strokeWidth: 2 })
  s.text(g1, 278, 175, 'traceparent ✓', { anchor: 'middle', size: 13, font: MONO, color: C.green, weight: 700 })

  // 2 · proxy forwards an allow-list of headers only
  const g2 = s.layer(2)
  s.envelope(g2, 595, 120, 56, 38, { stroke: C.grey, strokeWidth: 2 })
  s.text(g2, 623, 175, 'traceparent ✗', { anchor: 'middle', size: 13, font: MONO, color: C.red, weight: 700 })
  s.line(g2, 430, 20, 470, 130, { stroke: C.red, strokeWidth: 4 })
  s.line(g2, 470, 20, 430, 130, { stroke: C.red, strokeWidth: 4 })

  // 3 · two unrelated traces
  const g3 = s.layer(3)
  s.text(g3, 20, 215, 'trace 4bf9…', { size: 14, font: MONO, weight: 700, color: C.blue })
  s.rect(g3, 140, 200, 420, 30, { fill: C.blue, fillStyle: 'hachure', hachureGap: 6, stroke: C.blue })
  s.text(g3, 20, 260, 'trace 9c1d…', { size: 14, font: MONO, weight: 700, color: C.red })
  s.rect(g3, 330, 245, 200, 30, { fill: C.red, fillStyle: 'hachure', hachureGap: 6, stroke: C.red })
  s.text(g3, 590, 252, '← orders starts a new root span', { size: 15, color: C.red, weight: 600 })
  s.text(g3, 590, 274, '    nobody knows who called it', { size: 15, color: C.red, weight: 600 })

  // 4 · fix
  const g4 = s.layer(4)
  s.text(g4, 450, 310, 'fix: forward traceparent · tracestate · baggage, or instrument the proxy', { anchor: 'middle', size: 16, weight: 700, color: C.green })
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 900 330" class="w-full" />
</template>

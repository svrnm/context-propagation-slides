<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// Cross-process propagation: inject → carrier on the wire → extract → child span.
const svg = ref<SVGSVGElement>()

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.rect(g0, 20, 30, 300, 300, { stroke: C.blue, strokeWidth: 2.5 })
  s.rect(g0, 580, 30, 300, 300, { stroke: C.blue, strokeWidth: 2.5 })
  s.text(g0, 170, 312, 'checkout  (Java)', { anchor: 'middle', size: 18, weight: 700, color: C.blue })
  s.text(g0, 730, 312, 'payment  (Go)', { anchor: 'middle', size: 18, weight: 700, color: C.blue })
  s.line(g0, 330, 210, 570, 210, { stroke: C.grey, strokeWidth: 1.5, strokeLineDash: [8, 8] })
  s.text(g0, 450, 232, 'network (HTTP)', { anchor: 'middle', size: 13, color: C.grey, italic: true })
  s.pill(g0, 40, 60, 150, 32, 'span A', C.blueLight, C.navy, 15)

  // 1 · inject
  const g1 = s.layer(1)
  s.arrow(g1, 90, 96, 90, 182, { stroke: C.orangeDark, strokeWidth: 2 })
  s.box(g1, 40, 186, 120, 46, 'inject()', { stroke: C.orangeDark, strokeWidth: 2, fill: '#fff4d6', fillStyle: 'solid' }, { font: MONO, size: 16, color: C.orangeDark })
  s.arrow(g1, 165, 209, 200, 209, { stroke: C.orangeDark, strokeWidth: 2 }, 9)
  s.text(g1, 100, 140, 'getCurrent()', { size: 12, color: C.orangeDark, font: MONO })
  const env = s.mover([[1, 0, 0], [2, 400, 0]], g1)
  s.envelope(env, 205, 180, 90, 60, { stroke: C.ink, strokeWidth: 2 })
  s.text(env, 250, 256, 'carrier', { anchor: 'middle', size: 13, color: C.grey, italic: true })

  // 2 · on the wire
  const g2 = s.layer(2, { delay: 500 })
  s.text(g2, 450, 160, 'traceparent:', { anchor: 'middle', size: 14, font: MONO, weight: 700, color: C.navy })
  s.text(g2, 450, 182, '00-4bf92f…-a1b2c3…-01', { anchor: 'middle', size: 14, font: MONO, color: C.navy })

  // 3 · extract
  const g3 = s.layer(3)
  s.arrow(g3, 700, 209, 735, 209, { stroke: C.orangeDark, strokeWidth: 2 }, 9)
  s.box(g3, 740, 186, 125, 46, 'extract()', { stroke: C.orangeDark, strokeWidth: 2, fill: '#fff4d6', fillStyle: 'solid' }, { font: MONO, size: 16, color: C.orangeDark })
  s.arrow(g3, 802, 182, 802, 150, { stroke: C.orangeDark, strokeWidth: 2 })
  s.pill(g3, 725, 112, 150, 32, 'ctx: remote A', C.orange, C.navy, 14)

  // 4 · child span, same trace
  const g4 = s.layer(4)
  s.pill(g4, 725, 60, 150, 32, 'span B ← A', C.blueLight, C.navy, 15)
  s.curve(g4, 192, 70, 720, 70, -70, { stroke: C.orange, strokeWidth: 3, strokeLineDash: [10, 6] }, 14)
  s.text(g4, 455, 16, 'same trace, parent/child across processes', { anchor: 'middle', size: 15, weight: 700, color: C.orangeDark })
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 -10 900 350" class="w-full" />
</template>

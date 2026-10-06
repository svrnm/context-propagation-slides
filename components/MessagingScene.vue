<script setup lang="ts">
import { ref } from 'vue'
import { C, useRoughScene } from '../utils/rough-scene'

// Async messaging: context rides in message headers; batches use span links.
const svg = ref<SVGSVGElement>()

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.box(g0, 20, 90, 170, 80, 'producer', { stroke: C.blue, strokeWidth: 2.5 }, { color: C.navy, size: 20 })
  s.rect(g0, 330, 100, 260, 60, { stroke: C.ink, strokeWidth: 2 })
  for (let i = 1; i < 6; i++)
    s.line(g0, 330 + i * 43, 100, 330 + i * 43, 160, { stroke: C.grey, strokeWidth: 1, roughness: 0.6 })
  s.text(g0, 460, 185, 'queue / topic', { anchor: 'middle', size: 15, color: C.grey, italic: true })
  s.box(g0, 720, 90, 170, 80, 'consumer', { stroke: C.blue, strokeWidth: 2.5 }, { color: C.navy, size: 20 })
  s.pill(g0, 40, 50, 130, 28, 'span: publish', C.blueLight, C.navy, 13)

  const g1 = s.layer(1)
  s.text(g1, 105, 205, 'inject() into', { anchor: 'middle', size: 14, color: C.orangeDark, weight: 600 })
  s.text(g1, 105, 225, 'message headers', { anchor: 'middle', size: 14, color: C.orangeDark, weight: 600 })
  const env = s.mover([[1, 0, 0], [2, 270, 0], [3, 515, 0]], g1)
  s.envelope(env, 150, 113, 50, 34, { stroke: C.orangeDark, strokeWidth: 2 })

  const g3 = s.layer(3)
  s.text(g3, 805, 205, 'extract() on receive', { anchor: 'middle', size: 14, color: C.orangeDark, weight: 600 })
  s.pill(g3, 730, 50, 150, 28, 'span: process', C.blueLight, C.navy, 13)
  s.curve(g3, 170, 56, 730, 56, -60, { stroke: C.orange, strokeWidth: 2.5, strokeLineDash: [10, 6] }, 12)
  s.text(g3, 460, 14, 'minutes or hours later, still the same trace', { anchor: 'middle', size: 14, color: C.orangeDark, weight: 700 })

  const g4 = s.layer(4)
  s.rect(g4, 600, 240, 290, 50, { fill: C.blueLight, fillStyle: 'hachure', hachureGap: 6, stroke: C.blue, strokeWidth: 2 })
  s.text(g4, 745, 265, 'process batch (3 msgs)', { anchor: 'middle', size: 15, weight: 700, color: C.navy })
  ;['trace 4bf9…', 'trace 77a0…', 'trace c19e…'].forEach((t, i) => {
    const y = 212 + i * 36
    s.pill(g4, 400, y, 130, 26, t, C.white, C.navy, 12)
    s.curve(g4, 534, y + 13, 596, 262, 0, { stroke: C.grey, strokeWidth: 1.6, strokeLineDash: [6, 6] }, 9)
  })
  s.text(g4, 40, 268, 'span links:', { size: 15, color: C.navy, weight: 700 })
  s.text(g4, 40, 290, 'one span, many causes', { size: 15, color: C.grey, italic: true })
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 900 320" class="w-full" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// Problem statement: every service emits telemetry, but nothing ties one request together.
const svg = ref<SVGSVGElement>()

const services = ['frontend', 'checkout', 'payment', 'ledger']
const X = [20, 250, 480, 710]
const W = 170

const logs = [
  ['GET /cart 200', 'POST /buy 200', 'GET /cart 200'],
  ['order created', 'order created', 'cart empty'],
  ['charge ok', 'charge FAILED', 'charge ok'],
  ['tx 9921 saved', 'tx 9922 saved', 'tx 9923 saved'],
]
// the one request we are chasing sits at a different row in every service
const ours = [1, 0, 1, 2]

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  services.forEach((name, i) => {
    s.box(g0, X[i], 20, W, 60, name, { fill: C.blueLight, fillStyle: 'hachure', hachureGap: 7, stroke: C.blue, strokeWidth: 2 }, { color: C.navy, size: 20 })
  })

  const g1 = s.layer(1)
  for (let i = 0; i < 3; i++)
    s.arrow(g1, X[i] + W + 8, 50, X[i + 1] - 8, 50, { stroke: C.ink, strokeWidth: 2 })

  // created before the log layer so the thread is drawn underneath the text
  const g4 = s.layer(4, { duration: 1400 })
  const g2 = s.layer(2)
  logs.forEach((rows, i) => {
    rows.forEach((txt, r) => {
      const y = 120 + r * 46
      s.rect(g2, X[i], y, W, 36, { stroke: C.grey, strokeWidth: 1.2, roughness: 0.8 })
      s.text(g2, X[i] + 10, y + 18, `:0${r} ${txt}`, { font: MONO, size: 12, color: C.grey, weight: 500 })
    })
  })

  const g3 = s.layer(3, { to: 3 })
  for (let i = 0; i < 3; i++)
    s.text(g3, X[i] + W + 30, 190, '?', { anchor: 'middle', size: 44, weight: 800, color: C.red })
  s.text(g3, 450, 300, 'Which lines belong to the failed purchase?', { anchor: 'middle', size: 20, weight: 600, color: C.red })

  const pts = ours.map((r, i) => [X[i] + W / 2, 120 + r * 46 + 18] as [number, number])
  let d = `M${pts[0][0] - 80} ${pts[0][1]}`
  pts.forEach(([x, y]) => (d += ` L${x} ${y}`))
  d += ` L${pts[3][0] + 80} ${pts[3][1]}`
  s.path(g4, d, { stroke: C.orange, strokeWidth: 4, roughness: 1.6 }).setAttribute('opacity', '0.7')
  const g4top = s.layer(4, { delay: 600 })
  pts.forEach(([x, y]) => s.ellipse(g4top, x, y, W + 16, 46, { stroke: C.orange, strokeWidth: 2.5 }))
  s.pill(g4top, 300, 280, 300, 34, 'trace_id = 4bf92f3577b3…', C.orange, C.navy, 15)
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 900 330" class="w-full" />
</template>

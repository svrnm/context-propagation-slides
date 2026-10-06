<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// Anatomy of the W3C `traceparent` header, one field per click.
const svg = ref<SVGSVGElement>()

const CW = 15 // monospace cell width
const X0 = 37
const Y = 70

const parts = [
  { txt: '00', name: 'version', note: 'always 00 today', color: C.grey },
  { txt: '4bf92f3577b34da6a3ce929d0e0e4736', name: 'trace-id', note: '16 bytes · same for the whole trace', color: C.blue },
  { txt: '00f067aa0ba902b7', name: 'parent-id', note: '8 bytes · span id of the caller', color: C.orangeDark },
  { txt: '01', name: 'trace-flags', note: '01 = sampled', color: C.green },
]

function brace(x1: number, x2: number, y: number, h = 10) {
  const m = (x1 + x2) / 2
  return `M${x1} ${y} Q${x1} ${y + h} ${x1 + h} ${y + h} L${m - h} ${y + h} Q${m} ${y + h} ${m} ${y + 2 * h} Q${m} ${y + h} ${m + h} ${y + h} L${x2 - h} ${y + h} Q${x2} ${y + h} ${x2} ${y}`
}

useRoughScene(svg, (s) => {
  const hl = parts.map((_, i) => s.layer(i + 1))
  const g0 = s.layer(0)
  s.text(g0, X0, 22, 'traceparent:', { font: MONO, size: 20, weight: 700, color: C.navy })

  let x = X0
  parts.forEach((p, i) => {
    const w = p.txt.length * CW
    const g = hl[i]
    s.rect(g, x - 4, Y - 20, w + 8, 40, { fill: p.color, fillStyle: 'hachure', hachureGap: 6, fillWeight: 1, stroke: 'none' }).setAttribute('opacity', '0.35')
    s.text(g0, x, Y + 1, p.txt, { font: MONO, size: 24, weight: 600, width: w, color: C.ink })
    s.path(g, brace(x, x + w, Y + 26), { stroke: p.color, strokeWidth: 2, roughness: 0.6 })
    const cx = x + w / 2
    const ly = Y + 80 + (i % 2) * 70
    const anchor = i === 0 ? 'start' : i === 3 ? 'end' : 'middle'
    const lx = i === 0 ? x - 4 : i === 3 ? x + w + 4 : cx
    if (i % 2)
      s.line(g, cx, Y + 50, cx, ly - 18, { stroke: p.color, strokeWidth: 1.5 })
    s.text(g, lx, ly, p.name, { anchor, font: MONO, size: 20, weight: 800, color: p.color })
    s.text(g, lx, ly + 24, p.note, { anchor, size: 15, color: C.ink })
    x += w
    if (i < parts.length - 1) {
      s.text(g0, x, Y + 1, '-', { font: MONO, size: 24, weight: 600, width: CW, color: C.grey })
      x += CW
    }
  })
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 900 260" class="w-full" />
</template>

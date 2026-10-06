<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// Each hop receives the same trace-id and a new parent-id; the backend stitches the waterfall.
const svg = ref<SVGSVGElement>()

const rows = [
  { svc: 'frontend', op: 'GET /checkout', x1: 190, x2: 560, id: 'a1a1', parent: null },
  { svc: 'checkout', op: 'POST /order', x1: 215, x2: 530, id: 'b2b2', parent: 'a1a1' },
  { svc: 'payment', op: 'charge', x1: 255, x2: 440, id: 'c3c3', parent: 'b2b2' },
  { svc: 'ledger', op: 'INSERT tx', x1: 290, x2: 410, id: 'd4d4', parent: 'c3c3' },
]
const Y0 = 60
const RH = 62
const HX = 610
const CW = 11

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.text(g0, 20, 20, 'service', { size: 14, weight: 700, color: C.grey })
  s.text(g0, 190, 20, 'spans over time →', { size: 14, weight: 700, color: C.grey })
  s.text(g0, HX, 20, 'traceparent received', { size: 14, weight: 700, color: C.grey })
  s.line(g0, 10, 36, 890, 36, { stroke: C.greyLight, strokeWidth: 1.2, roughness: 0.5 })

  rows.forEach((r, i) => {
    const g = s.layer(i + 1)
    const y = Y0 + i * RH
    s.text(g, 20, y + 18, r.svc, { size: 17, weight: 700, color: C.navy })
    s.rect(g, r.x1, y, r.x2 - r.x1, 36, { fill: '#e4e8f5', fillStyle: 'solid', stroke: C.blue, strokeWidth: 1.8 })
    s.text(g, r.x1 + 10, y + 19, `${r.op} · ${r.id}`, { size: 13, color: C.navy, font: MONO, weight: 700 })
    if (!r.parent) {
      s.text(g, HX, y + 18, '(none) → start new trace', { size: 15, color: C.grey, italic: true })
      return
    }
    let x = HX
    const seg = (t: string, color: string, weight = 500) => {
      s.text(g, x, y + 18, t, { font: MONO, size: 17, width: t.length * CW, color, weight })
      x += t.length * CW
    }
    seg('00-', C.grey)
    seg('4bf9…', C.blue, 700)
    seg('-', C.grey)
    seg(`${r.parent}…`, C.orangeDark, 700)
    seg('-01', C.grey)
    // parent pointer
    const p = rows[i - 1]
    s.curve(g, r.x1 - 2, y + 18, p.x1 - 2, y - RH + 18, 22, { stroke: C.orangeDark, strokeWidth: 1.6 }, 8)
  })

  const g5 = s.layer(5)
  const col = (from: number, len: number, color: string, label: string, anchor: 'start' | 'end', dy: number) => {
    const x = HX + from * CW
    s.rect(g5, x - 5, Y0 + RH - 8, len * CW + 10, 2 * RH + 52, { stroke: color, strokeWidth: 2.5 })
    s.text(g5, anchor === 'end' ? x + len * CW + 5 : x - 5, Y0 + 4 * RH + dy, label, { anchor, size: 15, weight: 700, color })
  }
  col(3, 5, C.blue, 'never changes', 'end', 4)
  col(9, 5, C.orangeDark, 'changes every hop', 'start', 26)
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 900 330" class="w-full" />
</template>

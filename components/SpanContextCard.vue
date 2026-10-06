<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// What is inside "the context": SpanContext fields + baggage, revealed field by field.
const svg = ref<SVGSVGElement>()

const fields: [string, string, string][] = [
  ['trace_id', '4bf92f3577b34da6a3ce929d0e0e4736', 'shared by every span of the request'],
  ['span_id', '00f067aa0ba902b7', 'the current operation, i.e. the parent of the next one'],
  ['trace_flags', '01', 'sampled? (decided once, upstream)'],
  ['trace_state', 'vendor=opaque-value', 'vendor-specific extras'],
]

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.rect(g0, 10, 10, 600, 290, { stroke: C.blue, strokeWidth: 2.5, fill: '#eef0f8', fillStyle: 'solid' })
  s.text(g0, 30, 40, 'SpanContext', { size: 22, weight: 800, color: C.blue })
  s.text(g0, 600, 40, 'immutable · serializable', { anchor: 'end', size: 14, color: C.grey, italic: true })

  fields.forEach(([k, v, note], i) => {
    const g = s.layer(i + 1)
    const y = 80 + i * 55
    s.text(g, 30, y, k, { font: MONO, size: 17, weight: 700, color: C.navy })
    s.text(g, 175, y, v, { font: MONO, size: 16, color: C.ink })
    s.text(g, 175, y + 21, note, { size: 13, color: C.grey, italic: true })
    if (i < 3)
      s.line(g, 25, y + 37, 595, y + 37, { stroke: C.greyLight, strokeWidth: 1, roughness: 0.6 })
  })

  const g5 = s.layer(5)
  s.rect(g5, 650, 70, 230, 230, { stroke: C.orangeDark, strokeWidth: 2.5, fill: '#fff4d6', fillStyle: 'solid' })
  s.text(g5, 670, 100, 'Baggage', { size: 22, weight: 800, color: C.orangeDark })
  ;['user.tier=gold', 'tenant=acme', 'synthetic=true'].forEach((kv, i) => {
    s.text(g5, 670, 145 + i * 34, kv, { font: MONO, size: 15, color: C.ink })
  })
  s.text(g5, 670, 265, 'your own key/values,', { size: 13, color: C.grey, italic: true })
  s.text(g5, 670, 283, 'travel with the request', { size: 13, color: C.grey, italic: true })

  const g6 = s.layer(6)
  s.rect(g6, 0, 0, 890, 330, { stroke: C.ink, strokeWidth: 1.5, strokeLineDash: [8, 8], roughness: 0.8 })
  s.pill(g6, 340, 316, 210, 30, 'Context', C.ink, C.white, 16)
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="-5 -5 900 360" class="w-full" />
</template>

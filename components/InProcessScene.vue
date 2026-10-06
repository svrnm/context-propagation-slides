<script setup lang="ts">
import { ref } from 'vue'
import { C, MONO, useRoughScene } from '../utils/rough-scene'

// In-process propagation: an execution-scoped "current context" slot that callees read from.
const svg = ref<SVGSVGElement>()

const frames = [
  { x: 20, y: 140, label: 'handleRequest()' },
  { x: 60, y: 230, label: 'chargeCard()' },
  { x: 100, y: 320, label: 'callBank()' },
]

useRoughScene(svg, (s) => {
  const g0 = s.layer(0)
  s.rect(g0, 20, 20, 440, 74, { stroke: C.orangeDark, strokeWidth: 2, strokeLineDash: [10, 6], roughness: 1 })
  s.text(g0, 32, 36, 'current context  (ThreadLocal · AsyncLocalStorage · contextvars)', { size: 12, color: C.orangeDark, weight: 600 })
  frames.forEach(f => s.box(g0, f.x, f.y, 200, 54, f.label, { stroke: C.blue, strokeWidth: 2 }, { font: MONO, size: 16, color: C.navy }))

  const empty = s.layer(0, { to: 0 })
  s.text(empty, 240, 64, '(empty)', { anchor: 'middle', size: 16, color: C.grey, italic: true })

  // step 1: span A becomes current
  const a1 = s.layer(1, { to: 1 })
  s.pill(a1, 150, 46, 180, 32, 'ctx { span A }', C.orange, C.navy, 15)
  const s1 = s.layer(1)
  s.pill(s1, 240, 152, 90, 30, 'span A', C.blueLight, C.navy, 14)
  s.curve(s1, 285, 150, 240, 82, -30, { stroke: C.orangeDark, strokeWidth: 2 })

  // step 2: child span reads the current context, becomes current inside its scope
  const b = s.layer(2, { to: 3 })
  s.pill(b, 150, 46, 180, 32, 'ctx { span B }', C.orange, C.navy, 15)
  const s2 = s.layer(2)
  s.curve(s2, 345, 94, 365, 238, -25, { stroke: C.orangeDark, strokeWidth: 2 })
  s.text(s2, 352, 212, 'getCurrent()', { anchor: 'end', size: 13, color: C.orangeDark, font: MONO, weight: 600 })
  s.pill(s2, 280, 242, 170, 30, 'span B ← A', C.blueLight, C.navy, 14)

  // step 3: anything deeper (logs too!) picks it up for free
  const s3 = s.layer(3)
  s.curve(s3, 452, 94, 462, 328, -12, { stroke: C.orangeDark, strokeWidth: 2 })
  s.pill(s3, 320, 332, 150, 30, 'log ✓ span B', C.white, C.navy, 14)

  // step 4: scope ends, previous context restored
  const a2 = s.layer(4)
  s.pill(a2, 150, 46, 180, 32, 'ctx { span A }', C.orange, C.navy, 15)
  s.text(a2, 240, 108, 'scope closed → A restored', { anchor: 'middle', size: 13, color: C.green, weight: 700 })
}, undefined)
</script>

<template>
  <svg ref="svg" viewBox="0 0 480 400" class="w-full" />
</template>

import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import type { RoughSVG } from 'roughjs/bin/svg'
import { nextTick, onMounted, type Ref, watch } from 'vue'
import { onSlideEnter, useSlideContext } from '@slidev/client'

/** OpenTelemetry brand palette (taken from opentelemetry.io) */
export const C = {
  blue: '#4f61ab',
  blueLight: '#95a0cd',
  navy: '#1e2a5a',
  orange: '#f5a700',
  orangeDark: '#b57a00',
  ink: '#212529',
  grey: '#6c757d',
  greyLight: '#dee2e6',
  red: '#dc3545',
  green: '#198754',
  white: '#ffffff',
  paper: '#f8f9fa',
}

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const NS = 'http://www.w3.org/2000/svg'

export interface LayerOpts {
  /** last step at which the layer is still visible */
  to?: number
  /** extra delay (ms) before the layer starts drawing */
  delay?: number
  /** duration (ms) of the sketch-in animation */
  duration?: number
}

export interface TextOpts {
  size?: number
  weight?: number | string
  color?: string
  anchor?: 'start' | 'middle' | 'end'
  font?: string
  italic?: boolean
  /** force the rendered text into exactly this width (useful for monospace layouts) */
  width?: number
}

interface Layer {
  g: SVGGElement
  from: number
  to: number
  delay: number
  duration: number
  shown: boolean
}

interface Mover {
  g: SVGGElement
  stops: [step: number, x: number, y: number][]
}

/**
 * A tiny retained-mode helper around rough.js:
 * everything is drawn once into per-step layers, and `apply(step)` decides which
 * layers are visible. Newly visible layers are "sketched in" by animating the
 * stroke dash offset of every rough.js path, so clicks feel hand drawn.
 */
export class Scene {
  rc: RoughSVG
  layers: Layer[] = []
  movers: Mover[] = []
  seed = 1

  constructor(public svg: SVGSVGElement, public base: Options = {}) {
    this.rc = rough.svg(svg)
  }

  /** create a layer visible for `from <= step <= to` */
  layer(from = 0, opts: LayerOpts = {}): SVGGElement {
    const g = document.createElementNS(NS, 'g')
    g.style.opacity = '0'
    this.svg.appendChild(g)
    this.layers.push({ g, from, to: opts.to ?? Infinity, delay: opts.delay ?? 0, duration: opts.duration ?? 700, shown: false })
    return g
  }

  /** a group whose translation follows the given [step, x, y] stops (with a smooth transition) */
  mover(stops: [number, number, number][], parent?: SVGGElement): SVGGElement {
    const g = document.createElementNS(NS, 'g')
    g.style.transition = 'transform 900ms cubic-bezier(.65,0,.35,1)'
    ;(parent ?? this.svg).appendChild(g)
    this.movers.push({ g, stops })
    return g
  }

  private opts(o: Options = {}): Options {
    // fixed seeds keep shapes identical across re-renders (no jitter between clicks)
    return { roughness: 1.3, bowing: 1.2, stroke: C.ink, strokeWidth: 1.8, seed: this.seed++, ...this.base, ...o }
  }

  rect(g: SVGGElement, x: number, y: number, w: number, h: number, o?: Options) {
    return g.appendChild(this.rc.rectangle(x, y, w, h, this.opts(o)))
  }

  ellipse(g: SVGGElement, cx: number, cy: number, w: number, h: number, o?: Options) {
    return g.appendChild(this.rc.ellipse(cx, cy, w, h, this.opts(o)))
  }

  circle(g: SVGGElement, cx: number, cy: number, d: number, o?: Options) {
    return g.appendChild(this.rc.circle(cx, cy, d, this.opts(o)))
  }

  line(g: SVGGElement, x1: number, y1: number, x2: number, y2: number, o?: Options) {
    return g.appendChild(this.rc.line(x1, y1, x2, y2, this.opts(o)))
  }

  path(g: SVGGElement, d: string, o?: Options) {
    return g.appendChild(this.rc.path(d, this.opts(o)))
  }

  polygon(g: SVGGElement, pts: [number, number][], o?: Options) {
    return g.appendChild(this.rc.polygon(pts, this.opts(o)))
  }

  /** straight arrow with a sketched head */
  arrow(g: SVGGElement, x1: number, y1: number, x2: number, y2: number, o: Options = {}, head = 12) {
    this.line(g, x1, y1, x2, y2, o)
    const a = Math.atan2(y2 - y1, x2 - x1)
    for (const s of [-1, 1]) {
      const b = a + Math.PI + s * 0.45
      this.line(g, x2, y2, x2 + head * Math.cos(b), y2 + head * Math.sin(b), o)
    }
  }

  /** quadratic curved arrow; `bend` offsets the control point perpendicular to the chord */
  curve(g: SVGGElement, x1: number, y1: number, x2: number, y2: number, bend = 40, o: Options = {}, head = 12) {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const cx = mx + (-(y2 - y1) / len) * bend
    const cy = my + ((x2 - x1) / len) * bend
    this.path(g, `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, o)
    if (head > 0) {
      const a = Math.atan2(y2 - cy, x2 - cx)
      for (const s of [-1, 1]) {
        const b = a + Math.PI + s * 0.45
        this.line(g, x2, y2, x2 + head * Math.cos(b), y2 + head * Math.sin(b), o)
      }
    }
  }

  text(g: SVGGElement, x: number, y: number, str: string, t: TextOpts = {}) {
    const el = document.createElementNS(NS, 'text')
    el.setAttribute('x', String(x))
    el.setAttribute('y', String(y))
    el.setAttribute('fill', t.color ?? C.ink)
    el.setAttribute('font-size', String(t.size ?? 16))
    el.setAttribute('font-weight', String(t.weight ?? 500))
    el.setAttribute('font-family', t.font ?? FONT)
    el.setAttribute('text-anchor', t.anchor ?? 'start')
    el.setAttribute('dominant-baseline', 'middle')
    if (t.italic)
      el.setAttribute('font-style', 'italic')
    if (t.width) {
      el.setAttribute('textLength', String(t.width))
      el.setAttribute('lengthAdjust', 'spacingAndGlyphs')
    }
    el.textContent = str
    g.appendChild(el)
    return el
  }

  /** rectangle with a centered (multi-line) label */
  box(g: SVGGElement, x: number, y: number, w: number, h: number, label: string, o: Options = {}, t: TextOpts = {}) {
    this.rect(g, x, y, w, h, o)
    const lines = label.split('\n')
    const size = t.size ?? 18
    lines.forEach((ln, i) => {
      this.text(g, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.25, ln, { anchor: 'middle', size, weight: 600, ...t })
    })
  }

  /** small "pill" badge, e.g. for a context token */
  pill(g: SVGGElement, x: number, y: number, w: number, h: number, label: string, fill: string, color = C.ink, size = 14) {
    this.rect(g, x, y, w, h, { fill, fillStyle: 'solid', stroke: C.ink, strokeWidth: 1.4, roughness: 1 })
    this.text(g, x + w / 2, y + h / 2 + 1, label, { anchor: 'middle', size, weight: 700, color, font: MONO })
  }

  /** an envelope (carrier) icon */
  envelope(g: SVGGElement, x: number, y: number, w: number, h: number, o: Options = {}) {
    this.rect(g, x, y, w, h, { fill: C.white, fillStyle: 'solid', ...o })
    this.path(g, `M${x} ${y} L${x + w / 2} ${y + h * 0.55} L${x + w} ${y}`, o)
  }

  /** show/hide layers & move movers for the given step */
  apply(step: number, animate: boolean) {
    let order = 0
    for (const l of this.layers) {
      const visible = step >= l.from && step <= l.to
      if (visible && !l.shown) {
        l.shown = true
        l.g.style.opacity = '1'
        if (animate)
          this.sketchIn(l, order++)
        else
          this.finish(l)
      }
      else if (!visible && l.shown) {
        l.shown = false
        l.g.getAnimations({ subtree: true }).forEach(a => a.cancel())
        l.g.style.opacity = '0'
      }
    }
    for (const m of this.movers) {
      let pos: [number, number] | undefined
      for (const [s, x, y] of m.stops) {
        if (step >= s)
          pos = [x, y]
      }
      if (!pos)
        pos = [m.stops[0][1], m.stops[0][2]]
      if (!animate)
        m.g.style.transition = 'none'
      m.g.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`
      if (!animate) {
        void m.g.getBoundingClientRect()
        m.g.style.transition = 'transform 900ms cubic-bezier(.65,0,.35,1)'
      }
    }
  }

  reset() {
    for (const l of this.layers) {
      l.g.getAnimations({ subtree: true }).forEach(a => a.cancel())
      l.shown = false
      l.g.style.opacity = '0'
    }
  }

  private finish(l: Layer) {
    l.g.getAnimations({ subtree: true }).forEach(a => a.finish())
  }

  private sketchIn(l: Layer, _order: number) {
    const els = Array.from(l.g.querySelectorAll<SVGGraphicsElement>('path, text'))
    const n = els.length || 1
    const per = Math.max(120, l.duration * 0.6)
    els.forEach((el, i) => {
      const delay = l.delay + (i / n) * (l.duration - per * 0.5)
      if (el.tagName === 'path' && el.getAttribute('stroke') !== 'none') {
        let len = 0
        try {
          len = (el as SVGPathElement).getTotalLength()
        }
        catch {}
        if (!len)
          len = 1500
        el.animate(
          [{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }],
          { duration: per, delay, easing: 'ease-out', fill: 'backwards' },
        )
      }
      else {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: per, delay, easing: 'ease-out', fill: 'backwards' })
      }
    })
  }
}

/**
 * Wire a Scene into a Slidev slide: builds once on mount, re-sketches on slide
 * enter, and follows `$clicks`. Pass `step` to drive it manually instead.
 */
export function useRoughScene(svgRef: Ref<SVGSVGElement | undefined>, build: (s: Scene) => void, step?: () => number) {
  const ctx = useSlideContext()
  const current = step ?? (() => ctx.$clicks.value)
  let scene: Scene | undefined
  const staticMode = () => ctx.$nav.value.isPrintMode || ['overview', 'previewNext'].includes(ctx.$renderContext?.value)

  onMounted(() => {
    if (!svgRef.value)
      return
    scene = new Scene(svgRef.value)
    build(scene)
    scene.apply(current(), false)
    watch(current, v => scene?.apply(v, !staticMode()))
  })

  onSlideEnter(() => {
    nextTick(() => {
      if (!scene || staticMode())
        return
      scene.reset()
      scene.apply(current(), true)
    })
  })
}

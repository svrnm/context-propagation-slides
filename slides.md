---
title: Context Propagation
info: |
  How one request stays one trace across threads, processes and queues.
  Slides built with Slidev + rough.js, styled after opentelemetry.io.
colorSchema: light
layout: cover
transition: slide-left
fonts:
  provider: none
  sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
  mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
mdc: true
---

# Context Propagation

How one request stays **one trace** across threads, processes and queues.

::art::

<TitleSketch />

<!--
Today: the plumbing that makes distributed tracing work at all.
-->

---
clicks: 4
---

# One click, many services

A user hits "Buy". Four services each write their own telemetry.

<IslandsScene />

<!--
[click] The request flows through four services.
[click] Each one logs and traces in isolation.
[click] Under real traffic the lines interleave. Which ones belong to the failed purchase?
[click] Context propagation passes one identifier along the whole path, so every signal can be correlated.
-->

---
layout: center
---

<div class="big-quote max-w-3xl">

Context propagation means carrying a small piece of state, the <em>context</em>, along with a request wherever it goes, so that everything it touches can say <em>"I am part of this."</em>

</div>

<div class="grid grid-cols-2 gap-6 mt-10 max-w-3xl">
<div class="callout blue">

**In-process.** From function to function, across threads and `await`s.

</div>
<div class="callout">

**Cross-process.** Over HTTP, gRPC and message queues, as headers.

</div>
</div>

---
clicks: 6
---

# What's in the context?

<SpanContextCard />

<!--
[click] trace_id identifies the whole request.
[click] span_id is the current operation; the next span uses it as its parent.
[click] trace_flags: the sampling decision, made once at the root and respected downstream.
[click] trace_state: vendor-specific data.
[click] Baggage: arbitrary key/values you choose to propagate.
[click] Together they make up the Context, an immutable bag that propagators read from and write to.
-->

---
layout: section
---

<div class="eyebrow">Part 1</div>

# Inside a process

Passing context without passing it everywhere

---
clicks: 4
---

# Implicit context: the "current" slot

<div class="grid grid-cols-[1.05fr_1fr] gap-6 items-start">

```ts {all|4|12|13|all}
const tracer = trace.getTracer('checkout')

app.post('/buy', async (req, res) => {
  await tracer.startActiveSpan('handleRequest', async (spanA) => {
    await chargeCard(req.body) // no ctx argument!
    spanA.end()
  })
})

async function chargeCard(order) {
  // parent = whatever is current right now
  return tracer.startActiveSpan('chargeCard', async (spanB) => {
    await callBank(order) // logs here get span B's ids
    spanB.end()
  })
}
```

<InProcessScene />

</div>

<!--
startActiveSpan does two things: it creates a span whose parent is the current context, and it makes the new context current for the duration of the callback.
-->

---

# Where "current" lives, per language

| Language | Mechanism | You write |
|---|---|---|
| **Java** | `ThreadLocal` (plus agent instrumentation of executors) | `Context.current()`, `span.makeCurrent()` |
| **JavaScript** | `AsyncLocalStorage` (Node), Zone.js (browser) | `context.active()`, `context.with(ctx, fn)` |
| **Python** | `contextvars` | `context.get_current()`, `use_span(...)` |
| **.NET** | `AsyncLocal` / `Activity.Current` | `ActivitySource.StartActivity()` |
| **Go** | *explicit* `context.Context` argument | `ctx, span := tracer.Start(ctx, "op")` |

<div class="callout mt-8" v-click>

**Gotcha:** work handed to a thread pool, queue, or callback library may run **without** the current context.
Wrap it: `Context.current().wrap(runnable)`, `context.bind(ctx, fn)`, or pass `ctx` explicitly in Go.

</div>

---
layout: section
---

<div class="eyebrow">Part 2</div>

# Across processes

Serialize, ship, deserialize

---
clicks: 4
---

# Inject → carrier → extract

<InjectExtractScene />

<div class="scene-caption">
A <b>propagator</b> turns context into a carrier (usually headers) and back. Each side only needs to agree on the <b>format</b>.
</div>

<!--
[click] inject(): read the current context and write it into the outgoing request's headers.
[click] The carrier travels with the request.
[click] extract(): the receiving side rebuilds a context with a *remote* parent.
[click] The new span uses it as its parent: same trace, across processes.
-->

---
clicks: 4
---

# The W3C `traceparent` header

<TraceparentAnatomy />

<div v-click="4" class="callout blue mt-2 text-sm">

Companion header: `tracestate: congo=t61rcWkgMzE,rojo=00f067aa0ba902b7`. Opaque, vendor-specific, up to 32 entries.
Standardized by the W3C ([Trace Context](https://www.w3.org/TR/trace-context/)), the default in OpenTelemetry.

</div>

---
clicks: 5
---

# Hop by hop

<WaterfallScene />

<!--
Each hop: extract → start child span → inject its own span id as the new parent-id.
[click x4] Build the waterfall.
[click] trace-id is constant; parent-id changes on every hop. That is all the backend needs to rebuild the tree.
-->

---

# Doing it by hand

Auto-instrumentation does this for HTTP, gRPC and most messaging clients. For anything custom:

<div class="grid grid-cols-2 gap-6 code-sm">
<div>

### Client: inject

```ts
import { context, propagation } from '@opentelemetry/api'

const headers: Record<string, string> = {}
propagation.inject(context.active(), headers)
// headers = { traceparent: '00-4bf9…-a1b2…-01',
//             baggage: 'tenant=acme' }

await myCustomTransport.send(payload, headers)
```

</div>
<div>

### Server: extract

```ts
import { context, propagation } from '@opentelemetry/api'

transport.onMessage((payload, headers) => {
  const parent = propagation.extract(
    context.active(), headers)
  context.with(parent, () => {
    tracer.startActiveSpan('handle', (span) => {
      /* …your code… */
      span.end()
    })
  })
})
```

</div>
</div>

---

# Propagators: agree on a format

<div class="grid grid-cols-[1.2fr_1fr] gap-8">
<div>

| Propagator | Header(s) | Origin |
|---|---|---|
| `tracecontext` | `traceparent`, `tracestate` | W3C · **default** |
| `baggage` | `baggage` | W3C · **default** |
| `b3` / `b3multi` | `b3` / `X-B3-*` | Zipkin |
| `jaeger` | `uber-trace-id` | Jaeger |
| `xray` | `X-Amzn-Trace-Id` | AWS |

</div>
<div>

### Configure once, everywhere

```bash
OTEL_PROPAGATORS=tracecontext,baggage,b3multi
```

<div class="mt-4 text-sm leading-relaxed">

A **composite** propagator **injects all** listed formats and **extracts** from each in order.
Handy while migrating from Zipkin or Jaeger.

</div>
<div class="callout mt-4 text-sm">
If two hops speak no common format, the trace breaks at that hop.
</div>
</div>
</div>

---

# Baggage: your own context

```http
baggage: tenant=acme,user.tier=gold,synthetic=true
```

<div class="grid grid-cols-2 gap-8 mt-6">
<div v-click>

### Good for
- tenant / customer IDs for downstream attribution
- flags such as `synthetic=true` to filter test traffic
- routing and sampling hints deep in the call graph

</div>
<div v-click>

### Watch out
- **Not** added to spans automatically: use a `BaggageSpanProcessor` or copy keys yourself
- Sent to **every** downstream, including third parties. No secrets, no PII
- Small: the W3C limit is ~8 KB total

</div>
</div>

---
clicks: 4
---

# Async & messaging

<MessagingScene />

<!--
[click] The producer injects context into the message headers (Kafka record headers, AMQP properties, SQS attributes).
[click] The message sits in the queue, possibly for a long time.
[click] The consumer extracts it, and the processing span joins the producer's trace.
[click] Batch consumers have many parents. Use span links instead of a single parent.
-->

---
clicks: 4
---

# When the chain breaks

<BrokenChainScene />

<!--
[click] web sends traceparent.
[click] An old proxy forwards only an allow-list of headers.
[click] orders sees no parent and starts a new root, so you get two traces and no connection between them.
[click] Fix it by forwarding the headers or by instrumenting the hop.
-->

---

# Why is my trace broken? A checklist

<v-clicks>

- **A hop drops headers.** Proxies, API gateways, service meshes and CDNs with header allow-lists.
- **Formats don't match.** One side speaks `b3`, the other only `tracecontext`.
- **Context lost in-process.** Thread pools, callbacks, custom schedulers, fire-and-forget tasks.
- **Uninstrumented client or server.** Nobody calls `inject()`/`extract()`.
- **Trust boundaries.** At the public edge, consider *not* trusting incoming `traceparent`: start a new trace and add a **link** instead.

</v-clicks>

---
layout: section
---

<div class="eyebrow">Takeaways</div>

# Context ties your telemetry together

<div class="text-left max-w-2xl mx-auto mt-8 text-lg leading-relaxed">

1. **In-process:** a "current context" slot, implicit in most languages, explicit in Go.
2. **Cross-process:** propagators *inject* and *extract* it through carriers such as headers.
3. **W3C `traceparent`:** the trace-id stays the same, the parent-id changes on every hop.
4. **Every hop** must forward it, or the trace breaks.

</div>

---

# Learn more

- OpenTelemetry: [Context propagation concepts](https://opentelemetry.io/docs/concepts/context-propagation/)
- OpenTelemetry spec: [Context](https://opentelemetry.io/docs/specs/otel/context/) · [Propagators API](https://opentelemetry.io/docs/specs/otel/context/api-propagators/)
- W3C: [Trace Context](https://www.w3.org/TR/trace-context/) · [Baggage](https://www.w3.org/TR/baggage/)
- Messaging: [semantic conventions for messaging spans](https://opentelemetry.io/docs/specs/semconv/messaging/messaging-spans/)

---

# Credits & license

<div class="grid grid-cols-2 gap-8 text-sm leading-relaxed">
<div>

### This deck

© 2026 Severin Neumann, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Source: [github.com/svrnm/context-propagation-slides](https://github.com/svrnm/context-propagation-slides)

Not an official OpenTelemetry or CNCF publication.

### Trademarks

OpenTelemetry is a CNCF project. "OpenTelemetry" and the OpenTelemetry logo are trademarks of The Linux Foundation, used per its [trademark guidelines](https://www.linuxfoundation.org/legal/trademark-usage). Logo from [cncf/artwork](https://github.com/cncf/artwork). Look & feel inspired by opentelemetry.io.

</div>
<div>

### Sources

- [OpenTelemetry docs](https://opentelemetry.io/docs/concepts/context-propagation/), © OpenTelemetry Authors, CC BY 4.0
- [OpenTelemetry specification](https://opentelemetry.io/docs/specs/otel/context/), © OpenTelemetry Authors, Apache 2.0
- W3C [Trace Context](https://www.w3.org/TR/trace-context/) and [Baggage](https://www.w3.org/TR/baggage/)
- Code samples use the OpenTelemetry JavaScript API (Apache 2.0)

### Built with

[Slidev](https://sli.dev) and [rough.js](https://roughjs.com) (MIT)

</div>
</div>

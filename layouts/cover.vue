<template>
  <div class="slidev-layout otel-cover otel-dark">
    <img src="/otel-horizontal-white.svg" alt="OpenTelemetry" class="otel-cover__logo">
    <div class="otel-cover__grid">
      <div class="otel-cover__text">
        <slot />
      </div>
      <div class="otel-cover__art">
        <slot name="art" />
      </div>
    </div>
  </div>
</template>

import { defineAppSetup } from '@slidev/types'

// When the deck is embedded in an iframe (e.g. a blog post), flag it so
// style.css can keep the navigation bar visible instead of hover-only.
export default defineAppSetup(() => {
  if (typeof window !== 'undefined' && window.self !== window.top)
    document.documentElement.classList.add('in-iframe')
})

import ExampleViewerClient from './ExampleViewerClient'

// Static params for build-time generation
export async function generateStaticParams() {
  const exampleFiles = [
    'bible-trump',
    'devil-and-his-dam', 
    'finnigans-wake-david-foster-wallace',
    'infinite-jest-david-foster-wallace',
    'merchant-of-venice-doit-didion',
    'merchant-of-venice-happy-sad',
    'merchant-of-venice-ship-worries',
    'peter-pan-french',
    'pound-of-flesh',
    'wittgenstein-quine'
  ]
  
  return exampleFiles.map((filename) => ({
    filename: filename
  }))
}

export default function ExampleViewerPage() {
  return <ExampleViewerClient />
}
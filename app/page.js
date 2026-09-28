'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Layers, Sparkles, Timer } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

const features = [
  { icon: BookOpen, title: 'A home for your notes', description: 'Keep study material organized with topics, tags and quick search.' },
  { icon: Layers, title: 'Turn reading into recall', description: 'Generate flashcards from your material, then review the concepts that matter.' },
  { icon: Timer, title: 'See your study habits', description: 'Log study sessions and explore your activity in a personal dashboard.' },
]

export default function Home() {
  const { user } = useAuth()
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between border-b px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold"><BookOpen className="h-6 w-6 text-primary" />MindMate</Link>
        <div className="flex items-center gap-4"><ThemeToggle /><Link href={user ? '/dashboard' : '/login'} className="text-sm font-medium">{user ? 'Dashboard' : 'Sign in'}</Link></div>
      </nav>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="mb-5 flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />Your AI-powered study companion</p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Less scattered.<br /><span className="text-primary">More understood.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">Bring your notes, flashcards and study sessions together. Build a clearer study routine, one concept at a time.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={user ? '/dashboard' : '/signup'} className="inline-flex items-center gap-3 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground">{user ? 'Open your workspace' : 'Create your account'}<ArrowRight className="h-4 w-4" /></Link><a href="https://github.com/kvianAR/mindmate" className="rounded-lg border px-6 py-3 font-medium">Explore the source</a></div>
          <p className="mt-5 text-xs text-muted-foreground">AI features use Gemini. Review generated material for accuracy.</p>
        </div>
        <div className="rounded-2xl border bg-card p-7 shadow-sm sm:p-9">
          <p className="mb-7 text-xs font-medium uppercase tracking-widest text-muted-foreground">A simple study loop</p>
          {[['01', 'Capture', 'Write and organize your study notes.'], ['02', 'Understand', 'Summarize the key ideas with Gemini.'], ['03', 'Recall', 'Review flashcards and revisit difficult topics.'], ['04', 'Reflect', 'Log sessions and check your progress.']].map(([number, title, description]) => <div key={number} className="flex gap-4 border-t py-5"><span className="pt-1 font-mono text-sm text-primary">{number}</span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>)}
        </div>
      </section>
      <section aria-label="Features" className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 sm:px-8 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-xl border bg-card p-6"><Icon className="mb-5 h-6 w-6 text-primary" /><h2 className="text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p></article>)}
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 border-t px-5 py-6 text-xs text-muted-foreground sm:px-8"><p>MindMate · Built by Aditya Ranjan</p><a href="https://www.linkedin.com/in/aditya-ranjan-37a827323/" className="underline underline-offset-4">Connect on LinkedIn</a></footer>
    </main>
  )
}

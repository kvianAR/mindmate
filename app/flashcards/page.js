'use client'

import { useEffect, useState, useCallback } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiRequest } from '@/lib/api'
import { format } from 'date-fns'

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [currentFlashcard, setCurrentFlashcard] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [topic, setTopic] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [formData, setFormData] = useState({ front: '', back: '', topic: '' })
  const [generateData, setGenerateData] = useState({ topic: '', content: '', saveToDatabase: true })
  const [generating, setGenerating] = useState(false)

  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(topic && { topic }),
        sortBy,
        sortOrder
      })
      const data = await apiRequest(`/api/flashcards?${params}`)
      setFlashcards(data.flashcards)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch flashcards:', error)
    } finally {
      setLoading(false)
    }
  }, [topic, sortBy, sortOrder, page])

  useEffect(() => { fetchFlashcards() }, [fetchFlashcards])


  const handleCreate = () => {
    setFormData({ front: '', back: '', topic: '' })
    setDialogOpen(true)
  }

  const handleGenerate = () => {
    setGenerateData({ topic: '', content: '', saveToDatabase: true })
    setGenerateDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return
    try {
      await apiRequest(`/api/flashcards?id=${id}`, { method: 'DELETE' })
      fetchFlashcards()
    } catch (error) {
      alert('Failed to delete flashcard')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      setDialogOpen(false)
      fetchFlashcards()
    } catch (error) {
      alert('Failed to create flashcard')
    }
  }

  const handleGenerateSubmit = async (e) => {
    e.preventDefault()
    try {
      setGenerating(true)
      const data = await apiRequest('/api/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify(generateData)
      })
      
      if (generateData.saveToDatabase) {
        fetchFlashcards()
      } else {
        alert(`Generated ${data.flashcards.length} flashcards!`)
      }
      setGenerateDialogOpen(false)
      setGenerateData({ topic: '', content: '', saveToDatabase: true })
    } catch (error) {
      alert('Failed to generate flashcards: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleReview = (flashcard) => {
    setCurrentFlashcard(flashcard)
    setFlipped(false)
    setReviewDialogOpen(true)
  }

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleReviewComplete = async (difficulty) => {
    try {
      await apiRequest(`/api/flashcards/${currentFlashcard.id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ difficulty })
      })
      setReviewDialogOpen(false)
      fetchFlashcards()
    } catch (error) {
      alert('Failed to update flashcard')
    }
  }

  const topics = [...new Set(flashcards.map(f => f.topic).filter(Boolean))]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Flashcards</h1>
              <p className="text-muted-foreground text-lg">Study with AI-powered flashcards</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleGenerate} className="hover-lift">Generate with AI</Button>
              <Button onClick={handleCreate} className="hover-lift">Create Flashcard</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <Select value={topic || "all"} onValueChange={(v) => { setTopic(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="lastReviewed">Last Reviewed</SelectItem>
                <SelectItem value="reviewCount">Review Count</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            </div>
          ) : flashcards.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="py-16 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-2">No flashcards found</p>
                  <p className="text-sm">Create or generate your first flashcard to get started!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {flashcards.map((flashcard, index) => (
                  <Card 
                    key={flashcard.id} 
                    className="cursor-pointer card-hover group animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                    onClick={() => handleReview(flashcard)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{flashcard.front}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(flashcard.id)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                      {flashcard.topic && (
                        <Badge variant="secondary" className="mt-2 w-fit">{flashcard.topic}</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{flashcard.back}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Reviewed: {flashcard.reviewCount}x</span>
                        {flashcard.lastReviewed && (
                          <span>{format(new Date(flashcard.lastReviewed), 'MMM d')}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 animate-fade-in">
                  <Button 
                    variant="outline" 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                    className="transition-all disabled:opacity-40"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    disabled={page === pagination.totalPages} 
                    onClick={() => setPage(p => p + 1)}
                    className="transition-all disabled:opacity-40"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Flashcard</DialogTitle>
                <DialogDescription>Add a new flashcard manually</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="front">Front (Question)</Label>
                  <Textarea
                    id="front"
                    value={formData.front}
                    onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="back">Back (Answer)</Label>
                  <Textarea
                    id="back"
                    value={formData.back}
                    onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Flashcards with AI</DialogTitle>
                <DialogDescription>Let AI create flashcards from your content</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-topic">Topic</Label>
                  <Input
                    id="gen-topic"
                    value={generateData.topic}
                    onChange={(e) => setGenerateData({ ...generateData, topic: e.target.value })}
                    placeholder="e.g., Photosynthesis"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gen-content">Content</Label>
                  <Textarea
                    id="gen-content"
                    value={generateData.content}
                    onChange={(e) => setGenerateData({ ...generateData, content: e.target.value })}
                    rows={8}
                    placeholder="Paste your study material here..."
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="save-to-db"
                    checked={generateData.saveToDatabase}
                    onChange={(e) => setGenerateData({ ...generateData, saveToDatabase: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="save-to-db">Save flashcards to database</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generating}>
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Flashcard</DialogTitle>
              </DialogHeader>
              {currentFlashcard && (
                <div className="space-y-6">
                  <div 
                    className="h-[300px] perspective-1000 cursor-pointer"
                    onClick={handleFlip}
                  >
                    <div 
                      className="relative w-full h-full preserve-3d transition-transform duration-300"
                      style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                      <Card className="absolute inset-0 w-full h-full backface-hidden">
                        <CardContent className="p-6 text-center h-full flex flex-col items-center justify-center">
                          <div className="w-full max-w-full">
                            <p className="text-sm text-muted-foreground mb-4 font-medium">Question</p>
                            <div className="text-lg leading-relaxed break-words overflow-hidden max-h-48 overflow-y-auto">
                              {currentFlashcard.front}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                        <CardContent className="p-6 text-center h-full flex flex-col items-center justify-center">
                          <div className="w-full max-w-full">
                            <p className="text-sm text-muted-foreground mb-4 font-medium">Answer</p>
                            <div className="text-lg leading-relaxed break-words overflow-hidden max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {currentFlashcard.back}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleFlip}
                      className="hover-lift"
                    >
                      {flipped ? 'Show Question' : 'Show Answer'}
                    </Button>
                  </div>
                  {flipped && (
                    <div className="flex justify-center gap-3 animate-fade-in">
                      <Button 
                        variant="outline" 
                        onClick={() => handleReviewComplete('easy')}
                        className="hover-lift transition-all hover:bg-green-50 dark:hover:bg-green-950/20"
                      >
                        Easy
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReviewComplete('medium')}
                        className="hover-lift transition-all hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                      >
                        Medium
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReviewComplete('hard')}
                        className="hover-lift transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        Hard
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
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
import { apiRequest } from '@/lib/api'
import { format } from 'date-fns'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', topic: '', tags: '' })
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [summaryNote, setSummaryNote] = useState(null)
  const [summary, setSummary] = useState('')
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(topic && { topic }),
        sortBy,
        sortOrder
      })
      const data = await apiRequest(`/api/notes?${params}`)
      setNotes(data.notes)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }, [search, topic, sortBy, sortOrder, page])

  useEffect(() => { fetchNotes() }, [fetchNotes])


  const handleCreate = () => {
    setEditingNote(null)
    setFormData({ title: '', content: '', topic: '', tags: '' })
    setDialogOpen(true)
  }

  const handleEdit = (note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      topic: note.topic || '',
      tags: note.tags?.join(', ') || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      await apiRequest(`/api/notes/${id}`, { method: 'DELETE' })
      fetchNotes()
    } catch (error) {
      alert('Failed to delete note')
    }
  }

  const handleGenerateSummary = async (note) => {
    setSummaryNote(note)
    setSummary('')
    setSummaryDialogOpen(true)
    setGeneratingSummary(true)
    
    try {
      const data = await apiRequest('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({
          topic: note.topic || note.title,
          content: note.content
        })
      })
      setSummary(data.summary)
    } catch (error) {
      alert('Failed to generate summary: ' + error.message)
      setSummaryDialogOpen(false)
    } finally {
      setGeneratingSummary(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        topic: formData.topic || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }

      if (editingNote) {
        await apiRequest(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        await apiRequest('/api/notes', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      setDialogOpen(false)
      fetchNotes()
    } catch (error) {
      alert('Failed to save note')
    }
  }

  const topics = [...new Set(notes.map(n => n.topic).filter(Boolean))]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Notes</h1>
              <p className="text-muted-foreground text-lg">Manage your study notes</p>
            </div>
            <Button onClick={handleCreate} className="hover-lift">Create Note</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
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
                <SelectItem value="updatedAt">Last Updated</SelectItem>
                <SelectItem value="title">Title</SelectItem>
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
          ) : notes.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="py-16 text-center">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-2">No notes found</p>
                  <p className="text-sm">Create your first note to get started!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {notes.map((note, index) => (
                  <Card 
                    key={note.id} 
                    className="card-hover animate-fade-in group"
                    style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{note.title}</CardTitle>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => handleGenerateSummary(note)} className="h-7 px-2 text-xs">Summary</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(note)} className="h-7 px-2 text-xs">Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="h-7 px-2 text-xs">Delete</Button>
                        </div>
                      </div>
                      {note.topic && (
                        <Badge variant="secondary" className="mt-2 w-fit">{note.topic}</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {note.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.createdAt), 'MMM d, yyyy')}
                      </p>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
                <DialogDescription>
                  {editingNote ? 'Update your note' : 'Add a new study note'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Comma-separated tags"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingNote ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Summary</DialogTitle>
                <DialogDescription>
                  {summaryNote && `Summary for: ${summaryNote.title}`}
                </DialogDescription>
              </DialogHeader>
              {generatingSummary ? (
                <div className="py-8 text-center text-muted-foreground">
                  Generating summary...
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {summary}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setSummaryDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
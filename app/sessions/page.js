'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { apiRequest } from '@/lib/api'

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sessionData, setSessionData] = useState({
    topic: '',
    notesStudied: [],
    flashcardsReviewed: 0
  })
  const [isEndingSession, setIsEndingSession] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeSession])

  const fetchSessions = async () => {
    try {
      const data = await apiRequest('/api/sessions')
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewSession = () => {
    setActiveSession({
      startTime: new Date(),
      topic: sessionData.topic || 'General Study'
    })
    setElapsedTime(0)
    setIsDialogOpen(false)
  }

  const endSession = async () => {
    if (!activeSession || isEndingSession) return

    setIsEndingSession(true)
    try {
      const duration = Math.max(1, Math.floor(elapsedTime / 60)) // Minimum 1 minute
      console.log('Ending session with data:', {
        topic: activeSession.topic,
        duration: duration,
        notesStudied: sessionData.notesStudied,
        flashcardsReviewed: sessionData.flashcardsReviewed
      })
      
      const result = await apiRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          topic: activeSession.topic,
          duration: duration,
          notesStudied: sessionData.notesStudied,
          flashcardsReviewed: sessionData.flashcardsReviewed
        }),
      })
      
      console.log('Session saved successfully:', result)
      
      // Reset session state
      setActiveSession(null)
      setElapsedTime(0)
      setSessionData({
        topic: '',
        notesStudied: [],
        flashcardsReviewed: 0
      })
      // Refresh sessions list
      fetchSessions()
    } catch (error) {
      console.error('Failed to end session:', error)
      // Show user-friendly error message
      alert(`Failed to save session: ${error.message}`)
    } finally {
      setIsEndingSession(false)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Sessions</h1>
            <p className="text-muted-foreground mt-2">
              Track your learning progress and study time
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeSession ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium">Active Session</span>
                  <Badge variant="outline" className="font-mono">
                    {formatTime(elapsedTime)}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  onClick={endSession}
                  disabled={isEndingSession}
                  className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isEndingSession ? 'Saving...' : 'End Session'}
                </Button>
              </div>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    Start New Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Start New Study Session</DialogTitle>
                    <DialogDescription>
                      Set up your study session to track your progress effectively.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="topic">Study Topic (Optional)</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Mathematics, History, Programming"
                        value={sessionData.topic}
                        onChange={(e) => setSessionData(prev => ({ ...prev, topic: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="flashcards">Flashcards to Review</Label>
                      <Input
                        id="flashcards"
                        type="number"
                        placeholder="0"
                        value={sessionData.flashcardsReviewed}
                        onChange={(e) => setSessionData(prev => ({ ...prev, flashcardsReviewed: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={startNewSession}>
                      Start Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Separator />

        {/* Active Session Display */}
        {activeSession && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                Current Study Session
              </CardTitle>
              <CardDescription>
                Started at {new Date(activeSession.startTime).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {formatTime(elapsedTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">Session Duration</p>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {activeSession.topic || 'General Study'}
                  </div>
                  <p className="text-sm text-muted-foreground">Study Topic</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Statistics */}
        {sessions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {sessions.reduce((total, session) => total + session.duration, 0)} min
                </div>
                <p className="text-sm text-muted-foreground">Total Study Time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {sessions.length > 0 ? Math.round(sessions.reduce((total, session) => total + session.duration, 0) / sessions.length) : 0} min
                </div>
                <p className="text-sm text-muted-foreground">Average Session</p>
              </CardContent>
            </Card>
          </div>
        )}

        {sessions.length === 0 && !activeSession ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No study sessions yet</h3>
                  <p className="text-muted-foreground">
                    Start your first study session to begin tracking your progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : sessions.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {session.topic || 'Study Session'}
                      </CardTitle>
                      <Badge variant="secondary">
                        {session.duration} min
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{session.duration} minutes</span>
                      </div>
                      {session.flashcardsReviewed > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cards Reviewed:</span>
                          <span>{session.flashcardsReviewed}</span>
                        </div>
                      )}
                      {session.notesStudied?.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Notes Studied:</span>
                          <span>{session.notesStudied.length}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

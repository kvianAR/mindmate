'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customGoals, setCustomGoals] = useState([])
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [recentSessions, setRecentSessions] = useState([])
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'daily',
    target: '',
    category: 'study_time'
  })
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
    fetchRecentSessions()
    fetchCustomGoals()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest('/api/analytics?days=30')
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setAnalytics({
        overview: {
          totalNotes: 0,
          totalFlashcards: 0,
          totalSessions: 0,
          totalStudyTime: 0,
          totalFlashcardReviews: 0,
          topicsStudied: 0
        },
        recentActivity: {
          notesCreated: 0,
          flashcardsCreated: 0,
          sessionsCompleted: 0
        },
        dailyActivity: [],
        recommendations: [],
        topTopics: []
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentSessions = async () => {
    try {
      const data = await apiRequest('/api/sessions?limit=10')
      setRecentSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch recent sessions:', error)
    }
  }

  const fetchCustomGoals = async () => {
    try {
      const goals = JSON.parse(localStorage.getItem('customGoals') || '[]')
      setCustomGoals(goals)
    } catch (error) {
      console.error('Failed to fetch custom goals:', error)
    }
  }

  const createCustomGoal = () => {
    if (!newGoal.title || !newGoal.target) return

    const goal = {
      id: Date.now().toString(),
      ...newGoal,
      target: parseInt(newGoal.target),
      progress: 0,
      createdAt: new Date().toISOString()
    }

    const updatedGoals = [...customGoals, goal]
    setCustomGoals(updatedGoals)
    localStorage.setItem('customGoals', JSON.stringify(updatedGoals))
    
    setNewGoal({
      title: '',
      type: 'daily',
      target: '',
      category: 'study_time'
    })
    setIsGoalDialogOpen(false)
  }

  const deleteCustomGoal = (goalId) => {
    const updatedGoals = customGoals.filter(goal => goal.id !== goalId)
    setCustomGoals(updatedGoals)
    localStorage.setItem('customGoals', JSON.stringify(updatedGoals))
  }

  const handleCreateNote = () => {
    router.push('/notes')
  }

  const handleReviewFlashcards = () => {
    router.push('/flashcards')
  }

  const handleStartSession = () => {
    setRecentSessions([
      {
        id: Date.now(),
        type: 'Study Session',
        duration: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      },
      ...recentSessions.slice(0, 9)
    ])
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navbar />
          <div className="container mx-auto px-6 py-12">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-6 py-12">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome to Your Dashboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Track your learning journey, review your progress, and stay motivated with your study goals.
            </p>
          </div>

          {analytics ? (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-10">
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Study Summary</CardTitle>
                    <CardDescription>Real-time insights from your study activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Notes</span>
                          </div>
                          <span className="font-bold text-lg text-blue-800 dark:text-blue-200">
                            {analytics.overview.totalNotes}
                          </span>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            +{analytics.recentActivity.notesCreated} this week
                          </div>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Cards</span>
                          </div>
                          <span className="font-bold text-lg text-green-800 dark:text-green-200">
                            {analytics.overview.totalFlashcards}
                          </span>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            +{analytics.recentActivity.flashcardsCreated} this week
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Study Time</span>
                          </div>
                          <span className="font-bold text-purple-800 dark:text-purple-200">
                            {formatDuration(analytics.overview.totalStudyTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-purple-600 dark:text-purple-400">
                            {analytics.overview.totalSessions} sessions completed
                          </span>
                          <span className="text-purple-600 dark:text-purple-400">
                            +{analytics.recentActivity.sessionsCompleted} this week
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Study Areas</CardTitle>
                    <CardDescription>Your most active topics this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topTopics && analytics.topTopics.length > 0 ? (
                        analytics.topTopics.slice(0, 4).map((topic, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                              }`}></div>
                              <span className="font-medium text-sm truncate">{topic.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{topic.count}</div>
                              <div className="text-xs text-muted-foreground">notes</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <p className="text-muted-foreground text-sm">No topics yet</p>
                          <p className="text-muted-foreground text-xs mt-1">Create some notes to see your top topics!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest study sessions and activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSessions && recentSessions.length > 0 ? (
                        recentSessions.slice(0, 4).map((session, index) => (
                          <div key={session.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                session.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                              }`}></div>
                              <div>
                                <div className="font-medium text-sm">{session.type || 'Study Session'}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">
                                {session.duration ? formatDuration(session.duration) : 'Active'}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <div className="mb-2">
                            <svg className="w-8 h-8 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <p className="text-muted-foreground text-sm">No study sessions yet</p>
                          <p className="text-muted-foreground text-xs mt-1">Start a study session to track your progress!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-10">
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.7s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-xl">Quick Actions</CardTitle>
                    <CardDescription>Jump into your study activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <button 
                        onClick={handleCreateNote}
                        className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-all hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-blue-700 dark:text-blue-300">Create New Note</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Start writing and learning</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={handleReviewFlashcards}
                        className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-purple-700 dark:text-purple-300">Review Flashcards</p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">Practice and memorize</p>
                        </div>
                      </button>

                      <button 
                        onClick={handleStartSession}
                        className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/30 transition-all hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">Start Study Session</p>
                          <p className="text-sm text-green-600 dark:text-green-400">Track your focus time</p>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.8s', opacity: 0 }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Study Goals</CardTitle>
                        <CardDescription>Your daily study targets and custom goals</CardDescription>
                      </div>
                      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-8 px-3">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Goal
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Custom Goal</DialogTitle>
                            <DialogDescription>
                              Set a personalized study goal to stay motivated
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title">Goal Title</Label>
                              <Input
                                id="title"
                                value={newGoal.title}
                                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                                placeholder="e.g. Read 30 pages daily"
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="study_time">Study Time</SelectItem>
                                  <SelectItem value="notes">Notes Created</SelectItem>
                                  <SelectItem value="flashcards">Flashcards Reviewed</SelectItem>
                                  <SelectItem value="sessions">Study Sessions</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <Select value={newGoal.type} onValueChange={(value) => setNewGoal({...newGoal, type: value})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="target">Target</Label>
                                <Input
                                  id="target"
                                  type="number"
                                  value={newGoal.target}
                                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                                  placeholder="e.g. 60"
                                />
                              </div>
                            </div>
                            <Button onClick={createCustomGoal} className="w-full">
                              Create Goal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Daily Study Time</span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">60 min goal</span>
                        </div>
                        <div className="space-y-1">
                          <Progress value={Math.min((analytics.overview.totalStudyTime % 1440) / 60 * 100, 100)} className="h-2" />
                          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                            <span>{Math.min(analytics.overview.totalStudyTime % 1440, 60)} min</span>
                            <span>60 min</span>
                          </div>
                        </div>
                      </div>

                      {customGoals.length > 0 && customGoals.map((goal) => (
                        <div key={goal.id} className="p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{goal.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {goal.type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCustomGoal(goal.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{goal.progress}</span>
                              <span>{goal.target}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {customGoals.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">No custom goals yet</p>
                          <p className="text-xs mt-1">Create a goal to track your progress!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {analytics.recommendations && analytics.recommendations.length > 0 && (
                <Card className="mb-8 card-hover animate-fade-in" style={{ animationDelay: '0.9s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-xl">📚 Study Recommendations</CardTitle>
                    <CardDescription>Personalized suggestions based on your activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {analytics.recommendations.slice(0, 4).map((rec, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{rec.title}</h3>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{rec.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="card-hover animate-fade-in" style={{ animationDelay: '1.0s', opacity: 0 }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Analytics Overview</CardTitle>
                      <CardDescription>Complete breakdown of your study statistics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium">Total Study Hours</span>
                      <span className="font-bold text-lg">{formatDuration(analytics.overview.totalStudyTime)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium">Topics Covered</span>
                      <span className="font-bold text-lg">{analytics.overview.topicsStudied}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <span className="text-sm font-medium">Total Reviews</span>
                      <span className="font-bold text-lg">{analytics.overview.totalFlashcardReviews}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="animate-fade-in">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">Failed to load analytics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

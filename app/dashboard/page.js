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
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'daily',
    target: '',
    category: 'study_time'
  })
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
    fetchCustomGoals()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest('/api/analytics?days=30')
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
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

  const updateGoalProgress = (goalId, progress) => {
    const updatedGoals = customGoals.map(goal =>
      goal.id === goalId ? { ...goal, progress: Math.min(progress, goal.target) } : goal
    )
    setCustomGoals(updatedGoals)
    localStorage.setItem('customGoals', JSON.stringify(updatedGoals))
  }

  const deleteCustomGoal = (goalId) => {
    const updatedGoals = customGoals.filter(goal => goal.id !== goalId)
    setCustomGoals(updatedGoals)
    localStorage.setItem('customGoals', JSON.stringify(updatedGoals))
  }

  const getGoalProgress = (goal) => {
    if (!analytics) return 0
    
    switch (goal.category) {
      case 'study_time':
        return analytics.overview.totalStudyTime
      case 'notes':
        return analytics.recentActivity.notesCreated
      case 'flashcards':
        return analytics.overview.totalFlashcardReviews
      case 'sessions':
        return analytics.recentActivity.sessionsCompleted
      default:
        return goal.progress
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handleCreateNote = () => {
    router.push('/notes')
  }

  const handleReviewFlashcards = () => {
    router.push('/flashcards')
  }

  const handleStartSession = () => {
    router.push('/sessions')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-10 animate-fade-in">
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Your study progress and insights</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-sm font-medium">Total Notes</CardDescription>
                    <CardTitle className="text-4xl font-bold mt-2">{analytics.overview.totalNotes}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-sm font-medium">Total Flashcards</CardDescription>
                    <CardTitle className="text-4xl font-bold mt-2">{analytics.overview.totalFlashcards}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-sm font-medium">Study Time</CardDescription>
                    <CardTitle className="text-4xl font-bold mt-2">{formatTime(analytics.overview.totalStudyTime)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
                  <CardHeader className="pb-3">
                    <CardDescription className="text-sm font-medium">Topics Studied</CardDescription>
                    <CardTitle className="text-4xl font-bold mt-2">{analytics.overview.topicsStudied}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-10">
                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-xl">Study Summary</CardTitle>
                    <CardDescription>Insights from your notes and flashcards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Notes Insights */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-blue-700 dark:text-blue-300">Notes Created</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Last 30 days</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{analytics.recentActivity.notesCreated}</span>
                      </div>

                      {/* Flashcards Insights */}
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-purple-700 dark:text-purple-300">Cards Reviewed</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400">Total reviews</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analytics.overview.totalFlashcardReviews}</span>
                      </div>

                      {/* Study Progress */}
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-300">Study Progress</p>
                              <p className="text-sm text-green-600 dark:text-green-400">Average per topic</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-3">
                          <span className="text-green-600 dark:text-green-400">Topics covered: {analytics.overview.topicsStudied}</span>
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            {analytics.overview.topicsStudied > 0 ? Math.round(analytics.overview.totalFlashcards / analytics.overview.topicsStudied) : 0} cards/topic
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
                  <CardHeader>
                    <CardTitle className="text-xl">Learning Progress</CardTitle>
                    <CardDescription>Your topic mastery and study streak</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Study Streak */}
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-orange-700 dark:text-orange-300">Study Streak</p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Days active</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {analytics.recentActivity.sessionsCompleted > 0 ? Math.min(analytics.recentActivity.sessionsCompleted, 30) : 0} days
                        </span>
                      </div>

                      {/* Top Topics with Progress */}
                      {analytics.topTopics && analytics.topTopics.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Most Studied Topics</h4>
                          {analytics.topTopics.slice(0, 3).map((topic, index) => {
                            const progress = Math.min(90, 20 + (index * 20) + Math.random() * 40) // Simulated progress
                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{topic}</span>
                                  <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground text-sm">No topics yet. Create some notes to get started!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions and Study Goals */}
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
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Create Custom Goal</DialogTitle>
                            <DialogDescription>
                              Set a personal study goal to track your progress.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="goal-title">Goal Title</Label>
                              <Input
                                id="goal-title"
                                placeholder="e.g., Read 30 pages daily"
                                value={newGoal.title}
                                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="goal-category">Category</Label>
                              <Select value={newGoal.category} onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="study_time">Study Time (minutes)</SelectItem>
                                  <SelectItem value="notes">Notes Created</SelectItem>
                                  <SelectItem value="flashcards">Flashcard Reviews</SelectItem>
                                  <SelectItem value="sessions">Study Sessions</SelectItem>
                                  <SelectItem value="custom">Custom Goal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="goal-target">Target Value</Label>
                              <Input
                                id="goal-target"
                                type="number"
                                placeholder="e.g., 30"
                                value={newGoal.target}
                                onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="goal-type">Goal Type</Label>
                              <Select value={newGoal.type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily Goal</SelectItem>
                                  <SelectItem value="weekly">Weekly Goal</SelectItem>
                                  <SelectItem value="monthly">Monthly Goal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={createCustomGoal} disabled={!newGoal.title || !newGoal.target}>
                              Create Goal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Default Goals */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Study Time Goal</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.min(analytics.overview.totalStudyTime, 120)} / 120 min
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (analytics.overview.totalStudyTime / 120) * 100)} 
                          className="h-2" 
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Flashcard Reviews</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.min(analytics.overview.totalFlashcardReviews, 20)} / 20 reviews
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (analytics.overview.totalFlashcardReviews / 20) * 100)} 
                          className="h-2" 
                        />
                      </div>

                      {/* Custom Goals */}
                      {customGoals.length > 0 && (
                        <>
                          <div className="pt-2 border-t border-border/50">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Custom Goals</h4>
                          </div>
                          {customGoals.map((goal) => {
                            const currentProgress = getGoalProgress(goal)
                            const progressPercentage = Math.min(100, (currentProgress / goal.target) * 100)
                            
                            return (
                              <div key={goal.id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{goal.title}</span>
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {goal.type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {currentProgress} / {goal.target}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => deleteCustomGoal(goal.id)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </Button>
                                  </div>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                              </div>
                            )
                          })}
                        </>
                      )}

                      <div className="pt-2 border-t border-border/50">
                        {(() => {
                          const defaultGoals = [
                            analytics.overview.totalStudyTime >= 120,
                            analytics.overview.totalFlashcardReviews >= 20,
                          ]
                          const customGoalsCompleted = customGoals.filter(goal => getGoalProgress(goal) >= goal.target)
                          const totalGoals = defaultGoals.length + customGoals.length
                          const completedGoals = defaultGoals.filter(Boolean).length + customGoalsCompleted.length
                          
                          if (totalGoals === 0) {
                            return (
                              <p className="text-xs text-muted-foreground text-center">
                                💡 Create your first custom goal to get started!
                              </p>
                            )
                          } else if (completedGoals === totalGoals) {
                            return (
                              <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
                                🎉 Amazing! You&apos;ve completed all your goals!
                              </p>
                            )
                          } else if (completedGoals >= totalGoals / 2) {
                            return (
                              <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                                🔥 Great progress! {completedGoals}/{totalGoals} goals completed
                              </p>
                            )
                          } else {
                            return (
                              <p className="text-xs text-muted-foreground text-center">
                                💪 Keep going! {completedGoals}/{totalGoals} goals completed
                              </p>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="card-hover animate-fade-in" style={{ animationDelay: '0.9s', opacity: 0 }}>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Your activity over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center pb-3 border-b border-border/50 transition-colors hover:border-border">
                      <span className="text-sm font-medium">Notes Created</span>
                      <span className="font-bold text-lg">{analytics.recentActivity.notesCreated}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50 transition-colors hover:border-border">
                      <span className="text-sm font-medium">Flashcards Created</span>
                      <span className="font-bold text-lg">{analytics.recentActivity.flashcardsCreated}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-border/50 transition-colors hover:border-border">
                      <span className="text-sm font-medium">Sessions Completed</span>
                      <span className="font-bold text-lg">{analytics.recentActivity.sessionsCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center transition-colors">
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


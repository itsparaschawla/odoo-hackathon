'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QuestionCard from '@/components/QuestionCard'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('questions')
  const [userQuestions, setUserQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [userStats, setUserStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const [questionsRes, answersRes, statsRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/answers'),
        // fetch('/api/stats')
      ])

      const questionsData = await questionsRes.json()
      const answersData = await answersRes.json()
      // const statsData = await statsRes.json()

      if (questionsData.success) {
        setUserQuestions(questionsData.questions)
      }

      if (answersData.success) {
        setUserAnswers(answersData.answers)
      }

      // if (statsData.success) {
      //   setUserStats(statsData.stats)
      // }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        setUserQuestions(prev => prev.filter(q => q._id !== questionId))
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Manage your questions, answers, and track your contributions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Questions Asked</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.questionsCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Answers Given</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.answersCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reputation</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.reputation || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalVotes || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Questions ({userQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'answers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Answers ({userAnswers.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'questions' && (
        <div>
          {userQuestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                You haven't asked any questions yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by asking your first question to get help from the community
              </p>
              <Link
                href="/ask"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Ask Your First Question
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userQuestions.map((question) => (
                <div key={question._id} className="relative">
                  <QuestionCard question={question} />
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <Link
                      href={`/ask?edit=${question._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'answers' && (
        <div>
          {userAnswers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💭</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                You haven't answered any questions yet
              </h3>
              <p className="text-gray-600 mb-4">
                Help others by sharing your knowledge and expertise
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Questions
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userAnswers.map((answer) => (
                <div key={answer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Link
                      href={`/questions/${answer.questionId}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {answer.questionTitle}
                    </Link>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {answer.votes || 0}
                      </span>
                      {answer.isAccepted && (
                        <span className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Accepted
                        </span>
                      )}
                    </div>
                  </div>
                  <div 
                    className="prose prose-gray max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: answer.content }}
                  />
                  <div className="text-sm text-gray-500">
                    Answered on {new Date(answer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
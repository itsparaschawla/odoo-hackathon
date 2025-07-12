'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AnswerCard from '@/components/AnswerCard'
import Editor from '@/components/Editor'

export default function QuestionDetailPage() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [showAnswerForm, setShowAnswerForm] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQuestionData()
    }
  }, [id])

  const fetchQuestionData = async () => {
    try {
      const [questionRes, answersRes] = await Promise.all([
        fetch(`/api/questions/${id}`),
        fetch(`/api/questions/${id}/answers`)
      ])

      const questionData = await questionRes.json()
      const answersData = await answersRes.json()

      if (questionData.success) {
        setQuestion(questionData.question)
      }

      if (answersData.success) {
        setAnswers(answersData.answers)
      }
    } catch (error) {
      console.error('Error fetching question data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (type, targetId, targetType) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          targetId,
          targetType
        })
      })

      const data = await response.json()
      
      if (data.success) {
        if (targetType === 'question') {
          setQuestion(prev => ({
            ...prev,
            votes: data.votes,
            userVote: data.userVote
          }))
        } else {
          setAnswers(prev => prev.map(answer => 
            answer._id === targetId 
              ? { ...answer, votes: data.votes, userVote: data.userVote }
              : answer
          ))
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleAcceptAnswer = async (answerId) => {
    try {
      const response = await fetch(`/api/answers/${answerId}/accept`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (data.success) {
        setAnswers(prev => prev.map(answer => ({
          ...answer,
          isAccepted: answer._id === answerId
        })))
      }
    } catch (error) {
      console.error('Error accepting answer:', error)
    }
  }

  const handleSubmitAnswer = async (e) => {
    e.preventDefault()
    
    if (!answerContent.trim()) {
      return
    }

    setIsSubmittingAnswer(true)
    
    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: id,
          content: answerContent.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setAnswers(prev => [...prev, data.answer])
        setAnswerContent('')
        setShowAnswerForm(false)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">❓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Question not found</h2>
        <p className="text-gray-600 mb-4">
          The question you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          {/* Vote Section */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleVote('up', question._id, 'question')}
              className={`p-2 rounded-full transition-colors ${
                question.userVote === 'up'
                  ? 'bg-green-100 text-green-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-900">
              {question.votes || 0}
            </span>
            <button
              onClick={() => handleVote('down', question._id, 'question')}
              className={`p-2 rounded-full transition-colors ${
                question.userVote === 'down'
                  ? 'bg-red-100 text-red-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {question.title}
            </h1>
            
            <div 
              className="prose prose-gray max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Question Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Asked by {question.author?.username || 'Anonymous'}</span>
                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>{answers.length} answers</span>
                <span>{question.views || 0} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>
        
        {answers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-4xl mb-2">💭</div>
            <p className="text-gray-600">No answers yet. Be the first to help!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers
              .sort((a, b) => {
                if (a.isAccepted && !b.isAccepted) return -1
                if (!a.isAccepted && b.isAccepted) return 1
                return (b.votes || 0) - (a.votes || 0)
              })
              .map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  onVote={handleVote}
                  onAccept={handleAcceptAnswer}
                  canAccept={question.author?._id === 'currentUserId'} // Replace with actual user check
                />
              ))}
          </div>
        )}
      </div>

      {/* Answer Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Answer</h3>
        
        {!showAnswerForm ? (
          <button
            onClick={() => setShowAnswerForm(true)}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            Click to write your answer...
          </button>
        ) : (
          <form onSubmit={handleSubmitAnswer}>
            <div className="mb-4">
              <Editor
                value={answerContent}
                onChange={setAnswerContent}
                placeholder="Write your answer here. Be thorough and explain your reasoning..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAnswerForm(false)
                  setAnswerContent('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAnswer || !answerContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
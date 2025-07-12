'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QuestionCard from '@/components/QuestionCard'

export default function HomePage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [filterTag, setFilterTag] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [sortBy, filterTag])

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams()
      if (sortBy) params.append('sort', sortBy)
      if (filterTag) params.append('tag', filterTag)
      
      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
  }

  const handleTagFilter = (tag) => {
    setFilterTag(tag)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Questions</h1>
        <p className="text-gray-600">
          Browse and discover questions from the community
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSortChange('newest')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'newest'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => handleSortChange('popular')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'popular'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Most Popular
          </button>
          <button
            onClick={() => handleSortChange('unanswered')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'unanswered'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Unanswered
          </button>
        </div>

        {filterTag && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtered by:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {filterTag}
              <button
                onClick={() => handleTagFilter('')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {filterTag ? 'No questions found with this tag' : 'No questions yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filterTag 
                ? 'Try removing the filter or browse other topics.' 
                : 'Be the first to ask a question and help build the community!'
              }
            </p>
            <Link
              href="/ask"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ask the First Question
            </Link>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              onTagClick={handleTagFilter}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {questions.length > 0 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Load More Questions
          </button>
        </div>
      )}
    </div>
  )
}
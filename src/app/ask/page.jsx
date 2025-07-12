'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@/components/Editor'
import TagSelector from '@/components/TagSelector'

export default function AskPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const validateForm = () => {
    const newErrors = {}
    
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    } else if (title.length > 150) {
      newErrors.title = 'Title must not exceed 150 characters'
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }
    
    if (tags.length === 0) {
      newErrors.tags = 'At least one tag is required'
    } else if (tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tags,
          author: "64ac2a12ef1bd123abc45678"
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        router.push(`/questions/${data.question._id}`)
      } else {
        setErrors({ general: data.message || 'Failed to create question' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    if (errors.title) {
      setErrors({ ...errors, title: '' })
    }
  }

  const handleDescriptionChange = (content) => {
    setDescription(content)
    if (errors.description) {
      setErrors({ ...errors, description: '' })
    }
  }

  const handleTagsChange = (selectedTags) => {
    setTags(selectedTags)
    if (errors.tags) {
      setErrors({ ...errors, tags: '' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-gray-600">
          Share your knowledge and help others by asking a clear, detailed question.
        </p>
      </div>

      {/* Tips Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Tips for a great question:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific and descriptive in your title</li>
          <li>• Provide context and details in your description</li>
          <li>• Include relevant tags to help others find your question</li>
          <li>• Show what you've tried or researched already</li>
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="What's your question? Be specific and clear..."
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            maxLength={150}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title && (
              <p className="text-red-600 text-sm">{errors.title}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {title.length}/150 characters
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <div className={`border rounded-lg ${errors.description ? 'border-red-300' : 'border-gray-300'}`}>
            <Editor
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Provide more details about your question. Include what you've tried, expected results, and any relevant code or examples..."
            />
          </div>
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags *
          </label>
          <TagSelector
            selectedTags={tags}
            onTagsChange={handleTagsChange}
            maxTags={5}
          />
          {errors.tags && (
            <p className="text-red-600 text-sm mt-1">{errors.tags}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Add up to 5 tags to describe what your question is about
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </form>
    </div>
  )
}
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, MessageCircle, Eye, Check, Calendar, User } from 'lucide-react';

const QuestionCard = ({ question, currentUserId, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState(null);

  // Check if current user has voted
  const hasUpvoted = question.votes?.up?.includes(currentUserId);
  const hasDownvoted = question.votes?.down?.includes(currentUserId);

  const handleVote = async (voteType) => {
    if (!currentUserId || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: question._id,
          targetType: 'question',
          voteType,
          userId: currentUserId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(data.userVote);
        onVote && onVote(question._id, data.newScore);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting || !currentUserId}
            className={`p-2 rounded-full transition-colors ${
              hasUpvoted
                ? 'bg-green-100 text-green-600'
                : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
            } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronUp size={20} />
          </button>
          
          <span className={`font-semibold text-lg ${
            question.score > 0 ? 'text-green-600' : 
            question.score < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {question.score || 0}
          </span>
          
          <button
            onClick={() => handleVote('down')}
            disabled={isVoting || !currentUserId}
            className={`p-2 rounded-full transition-colors ${
              hasDownvoted
                ? 'bg-red-100 text-red-600'
                : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
            } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            <Link href={`/questions/${question._id}`}>
              {question.title}
            </Link>
          </h3>

          {/* Description Preview */}
          <p className="text-gray-600 mb-3 leading-relaxed">
            {truncateText(stripHtml(question.description))}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats and Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {/* Answer Count */}
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span>{question.answers?.length || 0} answers</span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{question.views || 0} views</span>
              </div>

              {/* Accepted Answer Indicator */}
              {question.acceptedAnswer && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check size={16} />
                  <span>Solved</span>
                </div>
              )}
            </div>

            {/* Author and Date */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={14} />
              <span className="font-medium text-gray-700">
                {question.author?.username || 'Anonymous'}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
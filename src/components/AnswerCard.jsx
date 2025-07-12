'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Check, User, Calendar, MessageCircle, Reply } from 'lucide-react';

const AnswerCard = ({ 
  answer, 
  currentUserId, 
  isQuestionOwner, 
  onVote, 
  onAccept, 
  onComment 
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Check if current user has voted
  const hasUpvoted = answer.votes?.up?.includes(currentUserId);
  const hasDownvoted = answer.votes?.down?.includes(currentUserId);

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
          targetId: answer._id,
          targetType: 'answer',
          voteType,
          userId: currentUserId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onVote && onVote(answer._id, data.newScore);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAccept = async () => {
    if (!isQuestionOwner) return;

    try {
      const response = await fetch('/api/answers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answerId: answer._id,
          action: 'accept'
        }),
      });

      if (response.ok) {
        onAccept && onAccept(answer._id);
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentUserId || isCommenting) return;

    setIsCommenting(true);
    try {
      const response = await fetch('/api/answers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answerId: answer._id,
          action: 'comment',
          content: commentText,
          userId: currentUserId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComment && onComment(answer._id, data.comment);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${
      answer.isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
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
            answer.score > 0 ? 'text-green-600' : 
            answer.score < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {answer.score || 0}
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

          {/* Accept Button */}
          {isQuestionOwner && !answer.isAccepted && (
            <button
              onClick={handleAccept}
              className="p-2 rounded-full hover:bg-green-100 text-gray-500 hover:text-green-600 transition-colors mt-2"
              title="Accept this answer"
            >
              <Check size={20} />
            </button>
          )}

          {/* Accepted Indicator */}
          {answer.isAccepted && (
            <div className="p-2 rounded-full bg-green-100 text-green-600 mt-2">
              <Check size={20} />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {/* Accepted Badge */}
          {answer.isAccepted && (
            <div className="flex items-center gap-2 mb-4 text-green-600">
              <Check size={16} />
              <span className="text-sm font-medium">Accepted Answer</span>
            </div>
          )}

          {/* Answer Content */}
          <div 
            className="prose prose-sm max-w-none mb-4 text-gray-700"
            dangerouslySetInnerHTML={{ __html: answer.content }}
          />

          {/* Author and Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={14} />
              <span className="font-medium text-gray-700">
                {answer.author?.username || 'Anonymous'}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(answer.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <MessageCircle size={14} />
                <span>
                  {answer.comments?.length || 0} comments
                </span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="border-t border-gray-200 pt-4">
              {/* Existing Comments */}
              {answer.comments?.map((comment, index) => (
                <div key={index} className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1">{comment.content}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>{comment.author?.username || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Comment */}
              {currentUserId && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || isCommenting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCommenting ? 'Adding...' : 'Comment'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
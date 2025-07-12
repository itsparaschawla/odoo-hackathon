import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import Answer from '@/models/Answer';
import Question from '@/models/Question';
import User from '@/models/User';

// Helper function to verify JWT token
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get user's votes for a specific question/answer
export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const answerId = searchParams.get('answerId');

    if (!questionId && !answerId) {
      return NextResponse.json(
        { error: 'Question ID or Answer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    let votes = {};

    if (questionId) {
      const question = await Question.findById(questionId);
      if (question) {
        const userVote = question.votes.find(
          vote => vote.user.toString() === user.userId
        );
        votes.question = userVote ? userVote.type : null;
      }
    }

    if (answerId) {
      const answer = await Answer.findById(answerId);
      if (answer) {
        const userVote = answer.votes.find(
          vote => vote.user.toString() === user.userId
        );
        votes.answer = userVote ? userVote.type : null;
      }
    }

    return NextResponse.json({ votes });

  } catch (error) {
    console.error('Get votes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Vote on a question or answer
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { targetId, targetType, voteType } = await request.json();

    // Validation
    if (!targetId || !targetType || !voteType) {
      return NextResponse.json(
        { error: 'Target ID, target type, and vote type are required' },
        { status: 400 }
      );
    }

    if (!['question', 'answer'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Target type must be "question" or "answer"' },
        { status: 400 }
      );
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Vote type must be "upvote" or "downvote"' },
        { status: 400 }
      );
    }

    await connectDB();

    let targetDoc;
    let Model;

    // Get the target document
    if (targetType === 'question') {
      Model = Question;
      targetDoc = await Question.findById(targetId);
    } else {
      Model = Answer;
      targetDoc = await Answer.findById(targetId);
    }

    if (!targetDoc) {
      return NextResponse.json(
        { error: `${targetType} not found` },
        { status: 404 }
      );
    }

    // Check if user is trying to vote on their own content
    if (targetDoc.author.toString() === user.userId) {
      return NextResponse.json(
        { error: 'You cannot vote on your own content' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const existingVoteIndex = targetDoc.votes.findIndex(
      vote => vote.user.toString() === user.userId
    );

    let voteChange = 0;
    let message = '';

    if (existingVoteIndex !== -1) {
      const existingVote = targetDoc.votes[existingVoteIndex];
      
      if (existingVote.type === voteType) {
        // User is clicking the same vote type - remove vote
        targetDoc.votes.splice(existingVoteIndex, 1);
        voteChange = voteType === 'upvote' ? -1 : 1;
        message = 'Vote removed';
      } else {
        // User is changing their vote
        existingVote.type = voteType;
        voteChange = voteType === 'upvote' ? 2 : -2;
        message = 'Vote updated';
      }
    } else {
      // New vote
      targetDoc.votes.push({
        user: user.userId,
        type: voteType
      });
      voteChange = voteType === 'upvote' ? 1 : -1;
      message = 'Vote added';
    }

    // Update vote count
    targetDoc.voteCount += voteChange;

    await targetDoc.save();

    return NextResponse.json({
      message,
      voteCount: targetDoc.voteCount,
      userVote: targetDoc.votes.find(
        vote => vote.user.toString() === user.userId
      )?.type || null
    });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get vote statistics for a user
export async function PUT(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    const targetUserId = userId || user.userId;

    await connectDB();

    // Get vote statistics for the user
    const [questionStats, answerStats] = await Promise.all([
      Question.aggregate([
        { $match: { author: targetUserId } },
        { $group: {
          _id: null,
          totalVotes: { $sum: '$voteCount' },
          totalQuestions: { $sum: 1 },
          avgVotes: { $avg: '$voteCount' }
        }}
      ]),
      Answer.aggregate([
        { $match: { author: targetUserId } },
        { $group: {
          _id: null,
          totalVotes: { $sum: '$voteCount' },
          totalAnswers: { $sum: 1 },
          avgVotes: { $avg: '$voteCount' },
          acceptedAnswers: { $sum: { $cond: ['$isAccepted', 1, 0] } }
        }}
      ])
    ]);

    const stats = {
      questions: questionStats[0] || { totalVotes: 0, totalQuestions: 0, avgVotes: 0 },
      answers: answerStats[0] || { totalVotes: 0, totalAnswers: 0, avgVotes: 0, acceptedAnswers: 0 },
      reputation: (questionStats[0]?.totalVotes || 0) + (answerStats[0]?.totalVotes || 0)
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get vote stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
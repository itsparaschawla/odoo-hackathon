import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Question from '@/models/Question';
import Answer from '@/models/Answer';

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

// Get user profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'User ID or username is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    let user;
    if (userId) {
      user = await User.findById(userId).select('-password');
    } else {
      user = await User.findOne({ username }).select('-password');
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user statistics
    const [questionStats, answerStats] = await Promise.all([
      Question.aggregate([
        { $match: { author: user._id } },
        { $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalVotes: { $sum: '$voteCount' },
          avgVotes: { $avg: '$voteCount' }
        }}
      ]),
      Answer.aggregate([
        { $match: { author: user._id } },
        { $group: {
          _id: null,
          totalAnswers: { $sum: 1 },
          totalVotes: { $sum: '$voteCount' },
          acceptedAnswers: { $sum: { $cond: ['$isAccepted', 1, 0] } }
        }}
      ])
    ]);

    const stats = {
      questions: questionStats[0] || { totalQuestions: 0, totalVotes: 0, avgVotes: 0 },
      answers: answerStats[0] || { totalAnswers: 0, totalVotes: 0, acceptedAnswers: 0 },
      reputation: (questionStats[0]?.totalVotes || 0) + (answerStats[0]?.totalVotes || 0)
    };

    return NextResponse.json({
      user,
      stats
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, email, bio, avatar } = await request.json();

    await connectDB();

    // Check if username/email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: user.userId } },
          { $or: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ]}
        ]
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's questions and answers
export async function POST(request) {
  try {
    const { userId, type, page = 1, limit = 10 } = await request.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and type are required' },
        { status: 400 }
      );
    }

    if (!['questions', 'answers'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "questions" or "answers"' },
        { status: 400 }
      );
    }

    await connectDB();

    const skip = (page - 1) * limit;

    if (type === 'questions') {
      const questions = await Question.find({ author: userId })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalQuestions = await Question.countDocuments({ author: userId });

      return NextResponse.json({
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalQuestions / limit),
          totalItems: totalQuestions,
          hasNextPage: page < Math.ceil(totalQuestions / limit),
          hasPrevPage: page > 1
        }
      });
    } else {
      const answers = await Answer.find({ author: userId })
        .populate('author', 'username')
        .populate('question', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalAnswers = await Answer.countDocuments({ author: userId });

      return NextResponse.json({
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAnswers / limit),
          totalItems: totalAnswers,
          hasNextPage: page < Math.ceil(totalAnswers / limit),
          hasPrevPage: page > 1
        }
      });
    }

  } catch (error) {
    console.error('Get user content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
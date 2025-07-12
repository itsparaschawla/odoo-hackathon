import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
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

// Get single question with answers
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeAnswers = searchParams.get('includeAnswers') !== 'false';
    const answersPage = parseInt(searchParams.get('answersPage')) || 1;
    const answersLimit = parseInt(searchParams.get('answersLimit')) || 10;

    await connectDB();

    // Get question with populated author
    const question = await Question.findById(id)
      .populate('author', 'username avatar')
      .lean();

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await Question.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    question.viewCount += 1;

    let answers = [];
    let answersPagination = null;

    if (includeAnswers) {
      const answersSkip = (answersPage - 1) * answersLimit;
      
      // Get answers sorted by votes (accepted first, then by vote count)
      answers = await Answer.find({ question: id })
        .populate('author', 'username avatar')
        .sort({ 
          isAccepted: -1,  // Accepted answers first
          voteCount: -1,   // Then by vote count
          createdAt: -1    // Then by newest
        })
        .skip(answersSkip)
        .limit(answersLimit)
        .lean();

      const totalAnswers = await Answer.countDocuments({ question: id });
      
      answersPagination = {
        currentPage: answersPage,
        totalPages: Math.ceil(totalAnswers / answersLimit),
        totalAnswers,
        hasNextPage: answersPage < Math.ceil(totalAnswers / answersLimit),
        hasPrevPage: answersPage > 1
      };
    }

    return NextResponse.json({
      question,
      answers,
      answersPagination
    });

  } catch (error) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update question
export async function PUT(request, { params }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { title, description, tags } = await request.json();

    await connectDB();

    // Find question and check ownership
    const question = await Question.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.author.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own questions' },
        { status: 403 }
      );
    }

    // Update question
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(tags && { tags }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('author', 'username avatar');

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });

  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete question
export async function DELETE(request, { params }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    await connectDB();

    // Find question and check ownership
    const question = await Question.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.author.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own questions' },
        { status: 403 }
      );
    }

    // Delete all answers associated with this question
    await Answer.deleteMany({ question: id });

    // Delete the question
    await Question.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
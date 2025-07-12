import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import  connectDB  from '@/lib/db';
import Answer from '@/models/Answer';
import Question from '@/models/Question';
import Notification from '@/models/Notification';
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

// Get answers for a specific question
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sort = searchParams.get('sort') || 'votes';

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'votes':
        sortOptions = { voteCount: -1, createdAt: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { voteCount: -1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Get answers with populated author data
    const answers = await Answer.find({ question: questionId })
      .populate('author', 'username')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalAnswers = await Answer.countDocuments({ question: questionId });
    const totalPages = Math.ceil(totalAnswers / limit);

    return NextResponse.json({
      answers,
      pagination: {
        currentPage: page,
        totalPages,
        totalAnswers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get answers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new answer
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { questionId, content } = await request.json();

    // Validation
    if (!questionId || !content) {
      return NextResponse.json(
        { error: 'Question ID and content are required' },
        { status: 400 }
      );
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: 'Answer must be at least 20 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Create answer
    const answer = new Answer({
      content,
      question: questionId,
      author: user.userId
    });

    await answer.save();

    // Update question's answer count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answerCount: 1 }
    });

    // Create notification for question author (if not answering own question)
    if (question.author.toString() !== user.userId) {
      const notification = new Notification({
        recipient: question.author,
        type: 'answer',
        message: `${user.username} answered your question: "${question.title}"`,
        relatedQuestion: questionId,
        relatedAnswer: answer._id
      });
      await notification.save();
    }

    // Populate author data
    await answer.populate('author', 'username');

    return NextResponse.json({
      message: 'Answer created successfully',
      answer
    }, { status: 201 });

  } catch (error) {
    console.error('Create answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update answer
export async function PUT(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { answerId, content, isAccepted } = await request.json();

    if (!answerId) {
      return NextResponse.json(
        { error: 'Answer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find answer
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    // Handle content update (only by answer author)
    if (content !== undefined) {
      if (answer.author.toString() !== user.userId) {
        return NextResponse.json(
          { error: 'You can only edit your own answers' },
          { status: 403 }
        );
      }

      answer.content = content;
      answer.updatedAt = new Date();
    }

    // Handle accepting answer (only by question author)
    if (isAccepted !== undefined) {
      const question = await Question.findById(answer.question);
      if (question.author.toString() !== user.userId) {
        return NextResponse.json(
          { error: 'Only the question author can accept answers' },
          { status: 403 }
        );
      }

      // If accepting this answer, unaccept any previously accepted answers
      if (isAccepted) {
        await Answer.updateMany(
          { question: answer.question, _id: { $ne: answerId } },
          { isAccepted: false }
        );
      }

      answer.isAccepted = isAccepted;
    }

    await answer.save();

    // Populate author data
    await answer.populate('author', 'username');

    return NextResponse.json({
      message: 'Answer updated successfully',
      answer
    });

  } catch (error) {
    console.error('Update answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete answer
export async function DELETE(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const answerId = searchParams.get('id');

    if (!answerId) {
      return NextResponse.json(
        { error: 'Answer ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find answer and check ownership
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }

    if (answer.author.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own answers' },
        { status: 403 }
      );
    }

    // Delete the answer
    await Answer.findByIdAndDelete(answerId);

    // Update question's answer count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answerCount: -1 }
    });

    return NextResponse.json({
      message: 'Answer deleted successfully'
    });

  } catch (error) {
    console.error('Delete answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
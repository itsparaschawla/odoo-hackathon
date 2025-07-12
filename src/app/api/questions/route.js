import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Question from '@/models/Question';
import Answer from '@/models/Answer';

// Get all questions with pagination, filtering, and sorting
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags') || '';
    const sort = searchParams.get('sort') || 'latest';

    await connectDB();

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    let sortOptions = {};
    switch (sort) {
      case 'latest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'most-answers':
        sortOptions = { answerCount: -1 };
        break;
      case 'most-votes':
        sortOptions = { voteCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const questions = await Question.find(query)
      .populate('author', 'username')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalQuestions = await Question.countDocuments(query);
    const totalPages = Math.ceil(totalQuestions / limit);

    return NextResponse.json({
      questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalQuestions,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new question (no auth)
export async function POST(request) {
  try {
    const { title, description, tags, author } = await request.json();

    if (!title || !description || !tags || tags.length === 0 || !author) {
      return NextResponse.json(
        { error: 'Title, description, tags, and author are required' },
        { status: 400 }
      );
    }

    if (title.length < 10) {
      return NextResponse.json(
        { error: 'Title must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    const question = new Question({
      title,
      description,
      tags,
      author,
    });

    await question.save();
    await question.populate('author', 'username');

    return NextResponse.json(
      { message: 'Question created successfully', question },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update question (no auth)
export async function PUT(request) {
  try {
    const { questionId, title, description, tags } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await connectDB();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        title: title || question.title,
        description: description || question.description,
        tags: tags || question.tags,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('author', 'username');

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete question (no auth)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await connectDB();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await Answer.deleteMany({ question: questionId });
    await Question.findByIdAndDelete(questionId);

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Question from '@/models/Question';

// Get all tags with usage counts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const popular = searchParams.get('popular') === 'true';

    await connectDB();

    // Aggregate tags from all questions
    const pipeline = [
      { $unwind: '$tags' },
      { $group: {
        _id: '$tags',
        count: { $sum: 1 },
        lastUsed: { $max: '$createdAt' }
      }},
      { $match: {
        _id: { $regex: search, $options: 'i' }
      }},
      { $sort: popular ? { count: -1 } : { _id: 1 } },
      { $limit: limit },
      { $project: {
        _id: 0,
        name: '$_id',
        count: 1,
        lastUsed: 1
      }}
    ];

    const tags = await Question.aggregate(pipeline);

    return NextResponse.json({ tags });

  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get tag statistics
export async function POST(request) {
  try {
    const { tagName } = await request.json();

    if (!tagName) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get questions with this tag
    const questions = await Question.find({ tags: tagName })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get tag statistics
    const stats = await Question.aggregate([
      { $match: { tags: tagName } },
      { $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        totalVotes: { $sum: '$voteCount' },
        totalViews: { $sum: '$viewCount' },
        totalAnswers: { $sum: '$answerCount' },
        avgVotes: { $avg: '$voteCount' },
        avgViews: { $avg: '$viewCount' },
        avgAnswers: { $avg: '$answerCount' }
      }}
    ]);

    return NextResponse.json({
      tag: tagName,
      questions,
      stats: stats[0] || {
        totalQuestions: 0,
        totalVotes: 0,
        totalViews: 0,
        totalAnswers: 0,
        avgVotes: 0,
        avgViews: 0,
        avgAnswers: 0
      }
    });

  } catch (error) {
    console.error('Get tag statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
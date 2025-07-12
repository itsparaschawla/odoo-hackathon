import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  votes: {
    up: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    down: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  score: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate score based on votes
answerSchema.methods.calculateScore = function() {
  this.score = this.votes.up.length - this.votes.down.length;
  return this.score;
};

// Add indexes for better query performance
answerSchema.index({ question: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ createdAt: -1 });
answerSchema.index({ score: -1 });

export default mongoose.models.Answer || mongoose.model('Answer', answerSchema);
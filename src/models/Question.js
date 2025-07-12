import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 10
  },
  tags: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // answers: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Answer'
  // }],
  // acceptedAnswer: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Answer',
  //   default: null
  // },
  // votes: {
  //   up: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }],
  //   down: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }]
  // },
  // score: {
  //   type: Number,
  //   default: 0
  // },
  // views: {
  //   type: Number,
  //   default: 0
  // },
  // isResolved: {
  //   type: Boolean,
  //   default: false
  // },
  // status: {
  //   type: String,
  //   enum: ['active', 'closed', 'deleted'],
  //   default: 'active'
  // }
}, {
  timestamps: true
});

// Calculate score based on votes
questionSchema.methods.calculateScore = function() {
  this.score = this.votes.up.length - this.votes.down.length;
  return this.score;
};

// Add indexes for better query performance
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ score: -1 });

export default mongoose.models.Question || mongoose.model('Question', questionSchema);
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;

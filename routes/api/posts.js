const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const User = require('../../models/User');

//@route POST api/posts
//@desc Create a post
//@access Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req); //This lines brings the request and validates it.
    if (!errors.isEmpty)
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.user.id).select('-password'); //dont bring the ps
      const newPost = new Post({
        //When saving schema objects, init them when creating
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      //make sure newpost is saved before sending response.
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
//@route GET api/posts
//@desc Get all posts
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 }); //date:-1 gets most resent
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route GET api/posts/:id
//@desc Get posts by id
//@access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    res.json(post);
  } catch (err) {
    if (!err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route DELETE api/posts/:id
//@desc Delete posts by id
//@access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();
    res.json({ msg: 'Post removed successfully. ' });
  } catch (err) {
    if (!err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

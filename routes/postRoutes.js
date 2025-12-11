const express = require('express');
const router = express.Router();
const postController = require('../controllers/PostController');
const { protect } = require('../middleware/authMiddleware'); 


router.post('/', protect, postController.createPost);        
router.get('/:id', postController.getPostById);               
router.put('/:id', protect, postController.updatePost);      
router.delete('/:id', protect, postController.deletePost);   

module.exports = router;
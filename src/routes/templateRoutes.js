const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', templateController.getAll);
router.get('/categories/list', templateController.getCategories);
router.get('/:identifier', templateController.getTemplateDetail);

router.post('/', authMiddleware, templateController.create);
router.put('/:id', authMiddleware, templateController.update);
router.delete('/:id', authMiddleware, templateController.delete);

module.exports = router;
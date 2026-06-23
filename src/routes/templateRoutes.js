const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadTemplate = require('../middleware/templateUploadMiddleware'); // Impor middleware upload template

router.get('/', templateController.getAll);
router.get('/categories/list', templateController.getCategories);
router.get('/:identifier', templateController.getTemplateDetail);

router.post('/', uploadTemplate, templateController.create);
router.put('/:id', uploadTemplate, templateController.update);
router.delete('/:id', templateController.delete);

module.exports = router;
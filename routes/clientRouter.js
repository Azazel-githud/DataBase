const express = require('express');
const clientController = require('../controllers/clientController');
const router = express.Router();

// ../clients
router.get('/', clientController.getClients); // Список клиентов
router.get('/add', clientController.addClientForm); // Форма добавления
router.post('/add', clientController.createClient); // Добавление клиента
router.get('/edit/:id', clientController.editClientForm); // Форма редактирования
router.post('/update/:id', clientController.updateClient); // Редактирование клиента
router.post('/delete/:id', clientController.deleteClient); // Удаление клиента

module.exports = router;
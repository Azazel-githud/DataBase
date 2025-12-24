// Импортируем необходимые модули
require('dotenv').config();
const User = require('./models/User');

async function main() {
  try {
    console.log('Лабораторная работа по базам данных запущена');

    // Создаем экземпляр модели User
    const userModel = new User();

    // Пример использования модели
    console.log('Получаем всех пользователей...');
    const users = await userModel.getAll();
    console.log('Пользователи:', users);

    // Пример создания нового пользователя
    console.log('Создаем нового пользователя...');
    const newUser = await userModel.create({
      name: 'Новый Пользователь',
      email: 'newuser@example.com'
    });
    console.log('Новый пользователь создан:', newUser);

    // Пример получения пользователя по ID
    if (users.length > 0) {
      const firstUser = await userModel.getById(users[0].id);
      console.log('Первый пользователь:', firstUser);
    }

  } catch (err) {
    console.error('Ошибка выполнения лабораторной работы:', err);
  }
}

// Запускаем основную функцию
main();
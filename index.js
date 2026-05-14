const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const products = require("./data/products.json");
const { auth } = require("./auth");
const nanoid = require("nanoid").nanoid;

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.100.33:5173"],
    credentials: true, // разрешаем отправлять куки и заголовки авторизации
  }),
);
app.use(express.json());

const SECRET = process.env.JWT_SECRET; // секрет для подписи JWT, в реальном приложении его нужно хранить в переменных окружения

// заранее заданные пользователи
const users = [
  {
    username: process.env.ADMIN_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.ADMIN_PSW, // сюда вставляешь хэш из .env
    _id: 1,
    name: "Админ",
    phone: "+998(90) 123-45-67",
    role: "Администратор",
  },
  {
    username: process.env.GAYRAT_USERNAME, // сюда вставляешь имя пользователя из .env
    password: process.env.GAYRAT_PSW, // сюда вставляешь хэш из .env
    _id: 2,
    name: "Гайрат Файзиев",
    phone: "+998 (90) 978-44-64",
    role: "Менеджер по продажам",
  },
];

const orders = []; // массив для хранения заказов, в реальном приложении это должна быть база данных

app.get("/products", auth, (req, res) => {
  res.json(products);
});

app.get("/orders", auth, (req, res) => {
  const userId = req.user._id; // получаем ID пользователя из запроса, который был установлен в middleware auth
  const userOrders = orders.filter((order) => order.user === userId); // фильтруем заказы по ID пользователя
  console.log(userOrders);

  res.json(userOrders);
});

app.post("/orders", auth, (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      agent,
      statusCode,
      products: orderProducts,
      comment,
      roadExpense,
    } = req.body;

    if (!name || !agent || statusCode === undefined) {
      return res.status(400).json({ message: "Отсутствуют обязательные поля" });
    }

    const newOrder = {
      _id: nanoid(),
      name,
      agent,
      statusCode,
      products: orderProducts || [],
      user: userId,
      createdAt: new Date(),
      comment,
      roadExpense: roadExpense || 0,
    };

    orders.unshift(newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

app.delete("/orders/:id", auth, (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;

  const orderIndex = orders.findIndex(
    (order) => order._id === orderId && order.user === userId,
  );

  if (orderIndex === -1) {
    return res.status(404).json({ message: "Заказ не найден" });
  }

  orders.splice(orderIndex, 1);
  res.json({ message: "Заказ удалён" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username); // находим пользователя по имени

  if (!user) {
    // если пользователя нет, возвращаем ошибку
    return res.status(401).json({ message: "Нет такого пользователя" });
  }

  const isMatch = await bcrypt.compare(password, user.password); // сравниваем введённый пароль с хэшем

  if (!isMatch) {
    // если пароли не совпали, возвращаем ошибку
    return res.status(401).json({ message: "Неверный пароль" });
  }

  const token = jwt.sign(
    { username: user.username, _id: user._id, name: user.name },
    SECRET,
    {
      // создаём токен с полезной нагрузкой (username) и секретом
      expiresIn: "1h", // токен будет действовать 1 час
    },
  );
  const userData = {
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
  res.json({ token, user: userData }); // возвращаем токен клиенту
});

app.listen(3000);

// index.js
// This is the main entry point of our application
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
// Сначала затребуем пакет в начале файла
const helmet = require('helmet')
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');

const db = require('./db');
const models = require('./models/index.js')
const resolvers = require('./resolvers/index.js')
const typeDefs = require('./shema.js')

const port = process.env.PORT || 5000
const DB_HOST = process.env.DB_HOST


const app = express()
// Добавляем промежуточное ПО в начало стека, после const app = express()
app.use(helmet());
// добавляем промежуточное ПО после app.use(helmet());
app.use(cors());
// Подключаем БД
db.connect(DB_HOST);


// Получаем информацию пользователя из JWT
const getUser = (token) => {
  if(token){
    try {
      // Возвращаем информацию пользователя из токена
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Если с токеном возникла проблема, выбрасываем ошибку
      new Error('Session invalid');
    }
  }

}

// Настройка Apollo Server
const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: ({req}) => {
    // Получаем токен пользователя из заголовков
    const token = req.headers.authorization;
    // Пытаемся извлечь пользователя с помощью токена
    const user = getUser(token)
    // Пока что будем выводить информацию о пользователе в консоль:
    console.log(user);
    //console.log(jwt.verify(token, process.env.JWT_SECRET));


    // Добавление моделей БД в context
    return { models, user }
  }
})  

// Применяем промежуточное ПО Apollo GraphQL и указываем путь к /api
server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () => 
  console.log(`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`)
);

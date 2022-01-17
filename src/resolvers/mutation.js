const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
        AuthenticationError,
        ForbiddenError
} = require('apollo-server-express');
const mongoose = require('mongoose');
require('dotenv').config();

const gravatar = require('../util/gravatar');


module.exports = {

    // Добавляем контекст пользователя user
    newNote: async(parent, args, {models, user}) => {   //изменение бд
      // Если в контексте нет пользователя, выбрасываем AuthenticationError
      if (!user) {
        throw new AuthenticationError('You must be signed in to create a note');
      }

      return await models.Note.create({
        content: args.content,
        // Ссылаемся на mongo id автора
        author: mongoose.Types.ObjectId(user.id)
        // author: 'Adam Scott'
      })

    },
    deleteNote: async(parent, {id}, {models, user}) => {
      // Если не пользователь, выбрасываем ошибку авторизации
      if (!user) {
        throw new AuthenticationError('You must be signed in to delete a note');
      }
      const note = await models.Note.findById(id)
      // Если владелец заметки и текущий пользователь не совпадают, выбрасываем
      // запрет на действие
      if(note && String(note.author) !== user.id){
        throw new ForbiddenError("You don't have permissions to delete the note");
      }
      try{
         // Если все проверки проходят, удаляем заметку
         await note.remove();
         //await models.Note.findOneAndRemove({ _id: id});
         return true
      }catch (err){
         return false;
      }
    },

    updateNote: async(parent, {id, content}, {models, user}) => {
      // Если не пользователь, выбрасываем ошибку авторизации
      if (!user) {
        throw new AuthenticationError('You must be signed in to delete a note');
      }
      const note = await models.Note.findById(id)
      // Если владелец заметки и текущий пользователь не совпадают, выбрасываем
      // запрет на действие
      if(note && String(note.author) !== user.id){
        throw new ForbiddenError("You don't have permissions to delete the note");
      }
      
      return await models.Note.findOneAndUpdate(
        {
        _id: id,
        },
        {
          $set: {
            content
          }
        },
        {
          new: true
        }
      )
    },

    signUp: async(parent, {username, email, password}, {models}) => {
      // Нормализуем имейл
      email = email.trim().toLowerCase();
      const hashed = await bcrypt.hash(password, 10)
      // Создаем url gravatar-изображения
      const avatar = gravatar(email);
      try{
        const user = await models.User.create({
          username,
          email,
          avatar,
          password: hashed
        })
        // Создаем и возвращаем json web token
        return jwt.sign({ id: user._id }, process.env.JWT_SECRET)

      }catch(err){

        console.log(err)
        // Если при регистрации возникла проблема, выбрасываем ошибку
        throw new Error('Error creating account');

      }
    },

    signIn: async(parent, {username, email, password}, {models}) => {
      // Нормализуем имейл
      if(email){
        email = email.trim().toLowerCase();
      }

      const user = await models.User.findOne({ $or: [{ email }, { username }] })

      if(!user){
        throw new AuthenticationError('Error signing in');
      }

      const valid = await bcrypt.compare(password, user.password)
      if(!valid){
        throw new AuthenticationError('Error Authentication user'); 
      }

      // Создаем и возвращаем json web token
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET)      
    },

    
    toggleFavorite: async (parent, { id }, { models, user }) => {
      // if no user context is passed, throw auth error
      if (!user) {
        throw new AuthenticationError();
      }

      // check to see if the user has already favorited the note
      let noteCheck = await models.Note.findById(id);
      const hasUser = noteCheck.favoritedBy.indexOf(user.id);

      // if the user exists in the list
      // pull them from the list and reduce the favoriteCount by 1
      if (hasUser >= 0) {
        return await models.Note.findByIdAndUpdate(
          id,
          {
            $pull: {
              favoritedBy: mongoose.Types.ObjectId(user.id)
            },
            $inc: {
              favoriteCount: -1
            }
          },
          {
            // Set new to true to return the updated doc
            new: true
          }
        );
      } else {
        // if the user doesn't exists in the list
        // add them to the list and increment the favoriteCount by 1
        return await models.Note.findByIdAndUpdate(
          id,
          {
            $push: {
              favoritedBy: mongoose.Types.ObjectId(user.id)
            },
            $inc: {
              favoriteCount: 1
            }
          },
          {
            new: true
          }
        );
      }
    }


}



























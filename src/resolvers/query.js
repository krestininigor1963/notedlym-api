
// Предоставляем функцию разрешения для полей схемы
module.exports = {
  
  notes: async(parent, args, { models }) => {return await models.Note.find().limit(100)}, //поиск всех из БД
  note:  async(parent, args, { models }) => {return await models.Note.findById(args.id);}, //поиск по ID из БД 
  user:  async(parent, args, { models }) => 
              {return await models.User.findOne({username: args.username})},
  users: async(parent, args, { models }) => 
              {return await models.User.find({}).limit(100)},
  me:    async(parent, args, { models, user }) => 
              {return await models.User.findById(user.id)},
  noteFeed: async(parent, { cursor }, { models }) => {
    const limit = 10;
    let hasNextPage = false;
    // Если курсор передан не будет, то по умолчанию запрос будет пуст
    // В таком случае из БД будут извлечены последние заметки
    let cursorQuery = {};
    // Если курсор задан, запрос будет искать заметки со значением ObjectId
    // меньше этого курсора
    if (cursor) {
      cursorQuery = { _id: { $lt: cursor } };
    }
    // Находим в БД limit + 1 заметок, сортируя их от старых к новым
    let notes = await models.Note.find(cursorQuery)
    .sort({ _id: -1 })
    .limit(limit + 1);

    // Если число найденных заметок превышает limit, устанавливаем
    // hasNextPage как true и обрезаем заметки до лимита
    if (notes.length > limit) {
      hasNextPage = true;
      notes = notes.slice(0, -1);
    }

    // Новым курсором будет ID Mongo-объекта последнего элемента массива списка
    const newCursor = notes[notes.length - 1]._id;

    return {
      notes,
      cursor: newCursor,
      hasNextPage
    };

  }




}
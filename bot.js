const TelegramBot = require("node-telegram-bot-api");
const { Client } = require("@notionhq/client");
require("dotenv").config();

// Создаем объект бота
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Создаем клиент для работы с Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Обработчик всех сообщений (включая первое сообщение)
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // Создаем меню с кнопками
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📝 Записать мысль", callback_data: "write_note" },
          { text: "📅 Просмотреть записи", callback_data: "view_notes" },
        ],
      ],
    },
  };

  // Отправляем кнопки сразу, как только пользователь пишет в чат
  bot.sendMessage(chatId, "Выберите действие:", options);
});

// Обработчик нажатия на кнопки
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const action = callbackQuery.data;

  if (action === "write_note") {
    bot.sendMessage(
      message.chat.id,
      "Пожалуйста, введите заголовок и мысль через пробел:"
    );

    // Ожидаем ввода текста пользователем
    bot.once("message", (msg) => {
      const userMessage = msg.text;
      const chatId = msg.chat.id;

      // Разделяем текст на заголовок и мысль
      const [title, ...thoughtArray] = userMessage.split(" ");
      const thought = thoughtArray.join(" "); // Все, что после первого слова - это мысль

      // Отправляем текст в Notion
      sendToNotion(title, thought);

      // Ответ пользователю
      bot.sendMessage(chatId, "Ваша мысль успешно записана!");
    });
  }

  if (action === "view_notes") {
    bot.sendMessage(message.chat.id, "Просмотр записей пока не реализован.");
  }
});

// Функция для отправки данных в Notion
const sendToNotion = async (title, thought) => {
  try {
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Запись: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        Дата: {
          date: {
            start: new Date().toISOString(),
          },
        },
        Мысль: {
          rich_text: [
            {
              text: {
                content: thought,
              },
            },
          ],
        },
        // Самочувствие: {
        //   select: {
        //     name: mood,
        //   },
        // },
      },
    });
    console.log("Запись успешно отправлена в Notion");
  } catch (error) {
    console.error("Ошибка при отправке в Notion:", error);
  }
};

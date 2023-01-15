import {
  create
} from 'venom-bot'
import * as dotenv from 'dotenv'
import {
  Configuration,
  OpenAIApi
} from "openai"

dotenv.config()

const configuration = new Configuration({
  organization: process.env.ORGANIZATION_ID,
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

create({
    sesion: 'chat-gpt',
    multidevice: true
  })

  .then((client) => start(client))
  .catch((e) => {
    console.error(e)
  })


const lerRespostaDavinci = async (clientText) => {
  const options = {
    model: "text-davinci-003", // Modelo GPT a ser usado
    prompt: clientText, // Texto enviado pelo usuário
    temperature: 1, // Nível de variação das respostas geradas, 1 é o máximo
    max_tokens: 4000 // Quantidade de tokens (palavras) a serem retornadas pelo bot, 4000 é o máximo
  }

  try {
    const resposta = await openai.createCompletion(options)
    let respostaDoBot = ""
    resposta.data.choices.forEach(({
      text
    }) => {
      respostaDoBot += text
    })
    return `Chat GPT 🤖 diz: \n\n ${respostaDoBot.trim()}`
  } catch (e) {
    console.log(e)
    return `❌ OpenAI houve um erro: ${e.resposta.data.error.message}`
  }
}

const lerRespostaDalle = async (clientText) => {
  const options = {
    prompt: clientText, // Descrição da imagem
    n: 1, // Número de imagens a serem geradas
    size: "1024x1024", // Tamanho da imagem
  }

  try {
    const response = await openai.createImage(options);
    return response.data.data[0].url
  } catch (e) {
    console.error(e)
    return `❌ OpenAI houve um erro: ${e.response.data.error.message}`
  }
}

const commands = (client, message) => {
  const comandos = {
    davinci3: "/prompt",
    dalle: "/img"
  }

  let firstWord = message.text.substring(0, message.text.indexOf(" "));

  switch (firstWord) {
    case comandos.davinci3:
      const question = message.text.substring(message.text.indexOf(" "));
      lerRespostaDavinci(question).then((response) => {
        client.sendText(message.to, response) // editei aqui para eu poder chamar em qualquer chat. No tutorial original foi feito para funcionar apenas falando comigo mesmo
      })
      break;

    case comandos.dalle:
      const imgDescription = message.text.substring(message.text.indexOf(" "));
      lerRespostaDalle(imgDescription, message).then((imgUrl) => {
        // editei aqui para eu poder chamar em qualquer chat. No tutorial original foi feito para funcionar apenas falando comigo mesmo
        client.sendImage(
          message.to,
          imgUrl,
          imgDescription,
          'Imagem gerada pela IA DALL-E 🤖'
        )
      })
      break;
  }
}

async function start(client) {
  client.onAnyMessage((msg) => {
    // console.log(msg)
    const textoAjuda = `
      Olá \n
      Digite /img <imagem desejada> para gerar uma imagem com a IA Dall-e 🖼 \n
      Digite /prompt <seu comando> para conversar com o Chat GPT 🤖 \n
    `
    if (msg.body.toLowerCase() === "/help") {
      client.sendText(msg.from, textoAjuda)
    } else {
      return commands(client, msg)
    }
  })
}
"use strict";

const { readFileSync, writeFileSync } = require("fs");
const {
  GoogleGenerativeAI,
  FunctionCallingMode,
  GenerativeModel,
  ChatSession,
} = require("@google/generative-ai");
const logger = require("@libs/utils/logger");
const chalk = require("chalk");
const sanitizeHtml = require("sanitize-html");
const functionTools = require("./function-call");
const User = require("./user");
const StateInjection = require("./injection/state");
const IoT = require("./injection/iot");
const ApiServe = require("./api");

/**
 * Gemini AI Assistant Controller
 */
class Gemini {
  /**
   * @param { import("@adiwajshing/baileys").WASocket } client - WhatsApp client instance
   * @param { import("@libs/utils/serialize").Serialize } msg - Serialized message object
   */
  constructor(client, msg) {
    /** @type { import("@adiwajshing/baileys").WASocket } */
    this.client = client;
    /** @type { import("@libs/utils/serialize").Serialize } */
    this.msg = msg;
    /** @type { GoogleGenerativeAI } */
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_APIKEY);
    /** @type { string } */
    this.sysInstruction = "SYSTEM_INSTRUCTIONS";
  }

  /**
   *
   * @param { import("./gemini").UserMessageDto } dto
   */
  messageMapper(dto) {
    return JSON.stringify(dto);
  }

  /**
   * Generate response based on user input
   * @param { Buffer } [img] - Optional image buffer
   * @param { { id: string; tagname: string; prompt: string } } param0 - User input parameters
   * @returns { Promise<import("@libs/builders/command").AwaitableMediaMessage> } - Generated response
   */
  async generative(img = null, { id, tagname, prompt }) {
    try {
      const sanitizedPrompt = this.messageMapper({
        phoneId: this.msg.from,
        userName: tagname,
        media: img ? "has-attached-media" : "no-media",
        messageType: "reguler-message",
        message: sanitizeHtml(prompt),
      });
      const model = this.getModel();
      const sessionChat = await this.getOrCreateSessionChat(id, tagname);

      if (img) {
        return await this.handleImagePrompt(
          model,
          sanitizedPrompt,
          img,
          sessionChat,
          id,
          tagname
        );
      }

      return await this.handleTextPrompt(
        model,
        sanitizedPrompt,
        sessionChat,
        id,
        tagname
      );
    } catch (error) {
      return await this.handleError(error, id, tagname);
    }
  }

  /**
   * Get the Gemini model instance
   * @returns { GenerativeModel } Configured Gemini model
   */
  getModel() {
    return this.gemini.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: this.sysInstruction,
      tools: functionTools,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });
  }

  /**
   * Get existing session chat or create a new one
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @returns { Promise<Content[]>} Session chat history
   */
  async getOrCreateSessionChat(id, tagname) {
    const existingUser = await User.readUserData(id);
    /**
     * @type { import("@google/generative-ai").Content[] }
     **/
    let sessionChat = existingUser ? existingUser.chats : [];
    if (sessionChat.length < 1) {
      logger.info("Successfully injected dataset!");
      sessionChat.push(
        ...StateInjection.init(await IoT.getSystemData(), {
          phoneId: this.msg.from,
          userName: tagname,
          media: "no-media",
          messageType: "dataset",
        })
      );
    }

    return sessionChat;
  }

  /**
   * Handle image-based prompts
   * @param { GenerativeModel } model - Gemini model instance
   * @param { string } prompt - User prompt
   * @param { Buffer } img - Image buffer
   * @param { import("@google/generative-ai").Content[] } sessionChat - Current session chat
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @returns { Promise<import("@libs/builders/command").AwaitableMediaMessage> } Generated response
   */
  async handleImagePrompt(model, prompt, img, sessionChat, id, tagname) {
    /**
     * @type { import("@google/generative-ai").GenerateContentResult }
     **/
    const visionResponse = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: img.toString("base64"),
          mimeType: "image/png",
        },
      },
    ]);
    const visionResponseText = visionResponse.response.text();
    sessionChat.push(
      ...StateInjection.withMediaPrompt(prompt, visionResponseText)
    );
    await this.updateUserData(id, tagname, sessionChat);
    return this.msg.reply(visionResponseText);
  }

  /**
   * Handle text-based prompts
   * @param { GenerativeModel } model - Gemini model instance
   * @param { string } prompt - User prompt
   * @param { import("@google/generative-ai").Content[] } sessionChat - Current session chat
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @returns { Promise<import("@libs/builders/command").AwaitableMediaMessage> } Generated response
   */
  async handleTextPrompt(model, prompt, sessionChat, id, tagname) {
    const chat = model.startChat({ history: sessionChat });
    const result = await chat.sendMessage(prompt);

    logger.info(chalk.magentaBright(`User ${id} uses autochat`));

    const responseFunctionCall = result.response.functionCalls();
    if (responseFunctionCall) {
      return await this.handleFunctionCall(
        chat,
        responseFunctionCall,
        id,
        tagname
      );
    } else {
      const content = await chat.getHistory();
      await this.updateUserData(id, tagname, content);
      return this.msg.reply(result.response.text());
    }
  }

  /**
   * Handle function calls from the AI
   * @param { ChatSession } chat - Current chat session
   * @param { import("@google/generative-ai").FunctionCall[] } responseFunctionCall - Function call response from AI
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @returns { Promise<import("@libs/builders/command").AwaitableMediaMessage> } Processed response
   */
  async handleFunctionCall(chat, responseFunctionCall, id, tagname) {
    console.log(JSON.stringify(responseFunctionCall, null, 2));

    const instanceApiServe = new ApiServe(this.client, this.msg);

    const mappedFC = responseFunctionCall.map(async (v) => {
      /**
       * @type { Promise<ReturnType<ApiServe>> }
       */
      const apiResponse = await instanceApiServe[v.name](v.args);
      return {
        functionResponse: {
          name: v.name,
          response: apiResponse,
        },
      };
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const modResult = await chat.sendMessage(mappedFC);
    writeFileSync(
      "./assets/json/state/gemini.json",
      JSON.stringify({ responseFunctionCall, apiResponse }, null, 2)
    );

    const modContent = await chat.getHistory();
    await this.updateUserData(id, tagname, modContent);

    logger.info("Gemini Function Call API Used!");
    return this.msg.reply(modResult.response.text());
  }

  /**
   * Update or create user data
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @param { import("@google/generative-ai").Content[] } content - Chat content to update
   */
  async updateUserData(id, tagname, content) {
    const existingUser = await User.readUserData(id);
    if (existingUser) {
      await User.updateUserData({ id, content });
    } else {
      await User.createUser({ id, tagname, content });
    }
  }

  /**
   * Handle errors in the Gemini controller
   * @param { Error } error - Error object
   * @param { string } id - User ID
   * @param { string } tagname - User tag name
   * @returns { Promise<import("@libs/builders/command").AwaitableMediaMessage> } Error response
   */
  async handleError(error, id, tagname) {
    logger.error(`Error in Gemini generative function: ${error.message}`);
    console.error(error);
    await User.clearUserChat({ id });
    logger.error(
      `User ${tagname} (${id}) message data was reset due to an error!`
    );
    return this.msg.reply("An Error Occured!");
  }
}

module.exports = Gemini;

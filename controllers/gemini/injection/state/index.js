const { readFileSync } = require("fs");

class StateInjection {
  /**
   * @param { string } state JSON Data
   * @param { import("@controllers/gemini/gemini").UserMessageDto } dto
   * @returns { import("@google/generative-ai").Content[] }
   */
  static init(state, dto) {
    const formatmessage =
      `<StateSystemData>\n${state}\n</StateSystemData>\n` +
      `<Instruction>In next conversation you will act as an Customer Service.</Instruction>`;
    const injection = JSON.stringify({
      ...dto,
      message: formatmessage,
    });
    return [
      {
        role: "user",
        parts: [
          {
            text: injection,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood, please let me know the next instructions or any specific details you need further analyzed or processed from this data.",
          },
        ],
      },
    ];
  }

  /**
   *
   * @param { string } userprompt
   * @param { string } model
   * @returns { import("@google/generative-ai").Content[] }
   */
  static withMediaPrompt(userprompt, model) {
    return [
      {
        role: "user",
        parts: [
          {
            text: userprompt,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: model,
          },
        ],
      },
    ];
  }
}

module.exports = StateInjection;

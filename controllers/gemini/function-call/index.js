const { FunctionDeclarationSchemaType } = require("@google/generative-ai");

/**
 * @type { import("@google/generative-ai").Tool[] }
 */
const functionTools = [
  {
    functionDeclarations: [
      {
        name: "TOOL_NAME",
        description: "DESCRIPTION",
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            PROPERTIES_NAME: "PROPERTIES_OBJECT",
          },
          description: "DESCRIPTIONS",
          required: ["PARAMS_REQUIRED"],
        },
      },
    ],
  },
];

module.exports = functionTools;

const logger = require("@libs/utils/logger");

class ApiServe {
  /**
   *
   * @param { import("@adiwajshing/baileys").WASocket } client
   * @param { import("@libs/utils/serialize").Serialize } msg
   */
  constructor(client, msg) {
    /**
     * @type { import("@adiwajshing/baileys").WASocket }
     */
    this.client = client;
    /**
     * @type { import("@libs/utils/serialize").Serialize }
     */
    this.msg = msg;
  }

  async getSystemStatus() {
    try {
      const response = await fetch("http://localhost:3000/iot");
      return await response.json();
    } catch (e) {
      logger.error(e);
      console.error(e);
      return JSON.stringify(
        {
          status: "error",
          message: "cannot process request due to an Error!",
        },
        null,
        2
      );
    }
  }

  async getSmartHomeStatus() {
    try {
      const response = await fetch("http://localhost:3000/iot");
      return await response.json();
    } catch (e) {
      logger.error(e);
      console.error(e);
      return JSON.stringify(
        {
          status: "error",
          message: "cannot process request due to an Error!",
        },
        null,
        2
      );
    }
  }
}

module.exports = ApiServe;

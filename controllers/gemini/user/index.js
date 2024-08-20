const schedule = require("node-schedule");
const { collections } = require("@database/mongodb");
const logger = require("@libs/utils/logger");

class User {
  /**
   *
   * @param { import("./user").CreateUserDto } param0
   */
  static async createUser({ id, tagname, content }) {
    /**
     * @type { import("@interface/schema").UserChats }
     */
    const user = {
      id,
      tagname,
      timestamp: new Date().toISOString(),
      countchats: 1,
      chats: content,
    };
    await collections.user.insertOne(user);
  }

  /**
   *
   * @param { string } id
   */
  static async readUserData(id) {
    const userData = await collections.user.findOne({ id });
    return userData ? userData : null;
  }

  /**
   *
   * @param { import("./user").UpdateUserDto } param0
   */
  static async updateUserData({ id, content }) {
    await collections.user.updateOne(
      { id },
      {
        $set: {
          timestamp: new Date().toISOString(),
          chats: content,
        },
        $inc: {
          countchats: 1,
        },
      }
    );
  }

  /**
   *
   * @param { { id: string } } param0
   */
  static async clearUserChat({ id }) {
    await collections.user.findOneAndUpdate(
      { id },
      {
        $set: {
          countchats: 0,
        },
        $push: {
          chats: {
            $each: [],
            $slice: 2,
          },
        },
      }
    );
  }

  /**
   *
   * @param { { id: string } } param0
   */
  static async deleteUserChat({ id }) {
    await collections.user.deleteOne({ id });
  }

  static async autoClearChatSession() {
    const getTime = new Date(Date.now() - 1 * 60 * 60 * 1000);
    await collections.user.updateMany(
      {
        timestamp: { $lt: getTime.toISOString() },
      },
      {
        $set: {
          countchats: 0,
          chats: [],
        },
      }
    );
    logger.info("Cleared inactive chat sessions");
  }
}

schedule.scheduleJob("0 */2 * * *", async () => {
  await User.autoClearChatSession();
});

module.exports = User;

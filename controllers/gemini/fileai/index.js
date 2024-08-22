const { GoogleAIFileManager } = require("@google/generative-ai/files");
const { writeFileSync } = require("fs");

class FileAi {
  constructor() {
    /**
     * @type { GoogleAIFileManager }
     */
    this.fileManager = new GoogleAIFileManager(process.env.GEMINI_APIKEY);
  }
  /**
   *
   * @param { string } path Path File
   * @param { { name: string; mimetype: string } } dto
   */
  async uploadViaPath(path, { name, mimetype }) {
    return await this.fileManager.uploadFile(path, {
      mimeType: mimetype,
      displayName: name.toLowerCase(),
    });
  }

  /**
   *
   * @param { Buffer } buff
   * @param { { name: string; mimetype: string } } sto
   */
  async uploadViaBuffer(buff, { name, mimetype }) {
    const filename = `${name}`.replace(" ", "");
    const filepath = `./controllers/gemini/fileai/file-temp/${filename}`;
    writeFileSync(filepath, buff);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return await this.fileManager.uploadFile(filepath, {
      mimeType: mimetype,
      displayName: name.toLowerCase(),
    });
  }

  /**
   *
   * @param { string } filename
   */
  async getFileMetadata(filename) {
    return await this.fileManager.getFile(filename);
  }

  async getListFiles() {
    return await this.fileManager.listFiles();
  }

  /**
   *
   * @param { string } filename
   */
  async deleteFiles(filename) {
    return await this.fileManager.deleteFile(filename);
  }
}

module.exports = FileAi;

export type UserMessageDto = {
  phoneId: string;
  userName: string;
  media: "no-media" | "has-attached-media";
  messageType: "dataset" | "common" | "system";
  message: string;
};

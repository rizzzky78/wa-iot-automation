import { Content } from "@google/generative-ai";
import { Collection } from "mongodb";

type User = {
  id: string;
  tagname: string;
  timestamp: string;
  countchats: number;
  chats: Content[];
};

type MongoCollection = {
  user: Collection<User>;
};

import { Client, Storage, ID, Databases, Account, Permission, Role, Query } from "appwrite";

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const storage = new Storage(client);
const account = new Account(client);
const appwriteDatabases = new Databases(client);

export { client, storage, ID, appwriteDatabases, account, Permission, Role, Query };

"use client";

import { Client, Account, Databases } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./config";

export function createBrowserClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
  };
}

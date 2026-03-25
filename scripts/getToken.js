import "dotenv/config";
import readline from "readline";
import { google } from "googleapis";
console.log(process.env.CLIENT_ID)

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000"
);

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
  throw new Error("Missing CLIENT_ID or CLIENT_SECRET in environment variables.");
}

const scopes = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

console.log("👉 Open this URL in browser:\n");
console.log(url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\n👉 Paste the code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n🎉 YOUR REFRESH TOKEN:\n");
    console.log(tokens.refresh_token);
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
  rl.close();
});
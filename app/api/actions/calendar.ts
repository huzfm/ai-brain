import { google } from "googleapis";
import { parseDate, parseTime } from "@/lib/ai";

const auth = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

auth.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth });

export async function createEvent(action: any) {
  if (!action.date || !action.time) {
    throw new Error("Missing date/time");
  }

  const start = new Date(`${action.date}T${action.time}:00`);

  if (isNaN(start.getTime())) {
    throw new Error("Invalid date/time");
  }

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = {
    summary: action.title || "AI Meeting",
    description: "Created by AI Agent",
    start: {
      dateTime: start.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    conferenceData: {
      createRequest: {
        requestId: "hackathon-" + Date.now(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
  });

  return res.data.hangoutLink;
}

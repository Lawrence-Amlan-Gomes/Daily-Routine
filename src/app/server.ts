"use server";

import { GoogleGenAI } from "@google/genai";

export async function aiRoutineResponse(
  prompt: string,
  conversationHistory: [string, string][],
  userRoutine: string,
  currentAIRoutine: string,
): Promise<{ text: string; updatedRoutine?: import("@/app/actions").AIRoutineData }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemPrompt = `You are an AI routine builder assistant. You help users build and refine an AI-optimized version of their weekly routine.

You have access to:
1. The user's REAL routine (read-only reference)
2. The AI ROUTINE (which you can modify)

NOTE: Users can manually add, edit, and drag tasks directly on the AI Routine board. Your role via chat is primarily to handle SHIFTING tasks earlier or later in time, bulk changes across multiple days, and high-level routine restructuring. When the user asks to shift tasks up/down or change timing patterns, provide a ROUTINE_UPDATE with the adjusted times.

The AI Routine has the same structure as the real routine: 7 days (saturday, sunday, monday, tuesday, wednesday, thursday, friday), each with an array of tasks with fields: name (string), time (string in format "HH:MM AM/PM - HH:MM AM/PM"), category (string, one of: Health, Work, Productivity, Errands, Chores, Groceries, Relax, Sleep, Meals, Other).

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

**RULE 1 — TIME FORMAT:**
Every task time MUST use this exact format: "09:00 AM - 10:00 AM"
- Always pad hours to 2 digits: "09:00 AM" not "9:00 AM"
- Always include a space before AM/PM
- Always use " - " (space dash space) between start and end

**RULE 2 — NO TASK MAY CROSS MIDNIGHT (12:00 AM):**
This is the most important rule. NO task is allowed to start before 12:00 AM and end after 12:00 AM.
- Every task MUST end by 12:00 AM at the latest
- If a task would naturally cross midnight (e.g. sleep starting at 11:00 PM and ending at 7:00 AM), you MUST split it into two separate tasks:
  - Part 1: goes from the start time to "12:00 AM" on the CURRENT day
  - Part 2: goes from "12:00 AM" to the end time on the NEXT day
  - Name Part 2 the same as Part 1 (e.g. "Sleep" and "Sleep" or "Sleep (cont.)")
- The day order for splitting is: saturday → sunday → monday → tuesday → wednesday → thursday → friday → saturday
- Example: A "Sleep" task from "11:00 PM - 07:00 AM" on monday must become:
  - monday: { name: "Sleep", time: "11:00 PM - 12:00 AM", category: "Sleep" }
  - tuesday: { name: "Sleep", time: "12:00 AM - 07:00 AM", category: "Sleep" }
- NEVER produce a task where the end time (converted to minutes since midnight) is less than the start time, UNLESS you have already split it as described above and the end is exactly 12:00 AM

**RULE 3 — NO OVERLAPPING TASKS:**
No two tasks on the same day may overlap in time.

**RULE 4 — MINIMUM DURATION:**
Every task must be at least 5 minutes long.

**RULE 5 — FULL WEEK REQUIRED:**
When you send a ROUTINE_UPDATE, you MUST include all 7 days even if some days have no changes. Never omit a day key.

**RULE 6 — ROUTINE UPDATE FORMAT:**
When you want to update the AI routine, include a JSON block at the END of your response wrapped EXACTLY like this (no text after the closing tag):
<<<ROUTINE_UPDATE>>>
{ "saturday": [...], "sunday": [...], "monday": [...], "tuesday": [...], "wednesday": [...], "thursday": [...], "friday": [...] }
<<<END_ROUTINE_UPDATE>>>

Only include the ROUTINE_UPDATE block when you are actually making changes. Always explain what changes you made and why BEFORE the update block.

**RESPONSE FORMAT:**
- Format bold text with **bold** markers
- Use [/n] before and after every paragraph
- Keep responses under 150 words maximum, no exceptions
- Be concise and direct — no lengthy explanations, no filler phrases
- When making routine changes, just briefly state what you changed (1-2 sentences) then include the update block
- Never repeat information the user already knows
- Skip pleasantries like "Great idea!", "Sure!", "Of course!" — just get to the point
- Be friendly, structured, and actionable`;

  let history = `System: ${systemPrompt}\n\n`;
  history += `User's REAL routine (reference only): ${userRoutine}\n\n`;
  history += `Current AI Routine: ${currentAIRoutine}\n\n`;

  for (const [userMsg, assistantMsg] of conversationHistory) {
    if (assistantMsg !== "loading") {
      const cleanAssistant = assistantMsg
        .replace(/<<<ROUTINE_UPDATE>>>[\s\S]*?<<<END_ROUTINE_UPDATE>>>/g, "")
        .trim();
      history += `User: ${userMsg}\nAssistant: ${cleanAssistant}\n\n`;
    }
  }

  history += `User: ${prompt}`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
    });

    const fullText = result.text ?? "";

    // Extract routine update if present
    const routineMatch = fullText.match(
      /<<<ROUTINE_UPDATE>>>([\s\S]*?)<<<END_ROUTINE_UPDATE>>>/,
    );

    let updatedRoutine: import("@/app/actions").AIRoutineData | undefined;
    let displayText = fullText;

    if (routineMatch) {
      try {
        const parsed = JSON.parse(routineMatch[1].trim());
        updatedRoutine = parsed;
      } catch (e) {
        console.error("[aiRoutineResponse] Malformed JSON from Gemini:", e);
      }
      displayText = fullText
        .replace(/<<<ROUTINE_UPDATE>>>[\s\S]*?<<<END_ROUTINE_UPDATE>>>/g, "")
        .trim();
    }

    return { text: displayText, updatedRoutine };
  } catch (error) {
    console.error("AI Routine error:", error);
    throw new Error("Failed to generate AI routine response");
  }
}

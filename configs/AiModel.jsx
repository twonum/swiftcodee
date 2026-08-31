import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

const CHAT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const CODE_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 65536,
  responseMimeType: "application/json",
};

const CANDIDATE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.5-pro",
    ].filter(Boolean)
  )
);

// In-memory tracker to skip models that recently returned a quota limit (429) for 60 seconds
const modelCooldownMap = new Map();

function isModelInCooldown(modelName) {
  const expiry = modelCooldownMap.get(modelName);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldownMap.delete(modelName);
    return false;
  }
  return true;
}

function setModelCooldown(modelName, durationMs = 60000) {
  modelCooldownMap.set(modelName, Date.now() + durationMs);
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in .env.local.");
  }

  return new GoogleGenerativeAI(apiKey);
}

function stripCodeFence(content) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function cleanJsonString(raw) {
  let cleaned = stripCodeFence(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

// Fallback extractor that recovers file code blocks via regex when JSON is truncated/malformed
function extractFilesByRegex(rawText) {
  console.log("[AiModel] Attempting regex fallback extraction for files...");
  const files = {};
  const fileRegex = /"(\/[^"]+\.(?:js|jsx|css|html|json))"\s*:\s*\{[\s\S]*?"code"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = fileRegex.exec(rawText)) !== null) {
    const filename = match[1];
    let codeStr = match[2];
    try {
      // Decode escaped JSON string
      codeStr = JSON.parse(`"${codeStr}"`);
    } catch {
      codeStr = codeStr.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    files[filename] = { code: codeStr };
  }

  // Extract title if possible
  const titleMatch = rawText.match(/"projectTitle"\s*:\s*"([^"]+)"/);
  const projectTitle = titleMatch ? titleMatch[1] : "Generated Project";

  // Extract explanation if possible
  const explMatch = rawText.match(/"explanation"\s*:\s*"([^"]+)"/);
  const explanation = explMatch ? explMatch[1] : "Interactive React Project";

  if (Object.keys(files).length > 0) {
    console.log(`[AiModel] Regex fallback successfully recovered ${Object.keys(files).length} files!`);
    return {
      projectTitle,
      explanation,
      files,
      generatedFiles: Object.keys(files),
    };
  }
  return null;
}

function parseJsonSafely(rawText) {
  const cleaned = cleanJsonString(rawText);
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (repairErr) {
      try {
        const repairedRaw = jsonrepair(rawText);
        return JSON.parse(repairedRaw);
      } catch (rawRepairErr) {
        // Fallback: Attempt regex-based recovery
        const recovered = extractFilesByRegex(rawText);
        if (recovered && Object.keys(recovered.files).length > 0) {
          return recovered;
        }
        console.error("[AiModel] JSON repair & regex extraction completely failed:", repairErr?.message);
        throw initialErr;
      }
    }
  }
}

const RETRYABLE_CODES = [503, 502, 504];

function isTransientServerError(err) {
  const status = err?.status || err?.response?.status;
  return RETRYABLE_CODES.includes(status) || /503|502|504|overloaded|service unavailable/i.test(err?.message || "");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callWithFallback(generationConfig, prompt) {
  const genAI = getGenAI();
  let lastError;

  for (const modelName of CANDIDATE_MODELS) {
    // Skip model if it is currently in cooldown from a 429 quota exhaustion
    if (isModelInCooldown(modelName)) {
      console.log(`[AiModel] Skipping ${modelName} (temporarily in cooldown due to quota limit).`);
      continue;
    }

    let attempt = 0;
    while (attempt <= 1) {
      try {
        console.log(`[AiModel] Requesting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        });
        return result;
      } catch (err) {
        lastError = err;
        attempt++;

        // If 429 quota limit occurs, put this model in cooldown and immediately switch to the next model!
        const isQuotaError = /429|quota|rate.?limit/i.test(err?.message || "");
        if (isQuotaError) {
          console.warn(`[Gemini API] Quota reached for ${modelName}. Putting in 60s cooldown and seamlessly switching to next model...`);
          setModelCooldown(modelName, 60000);
          break; // Immediately move to next candidate model
        }

        // If transient 503 error, retry once briefly before switching
        if (isTransientServerError(err) && attempt <= 1) {
          const delay = 1000;
          console.warn(`[Gemini API] ${modelName} temporary overload. Retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          console.warn(`[Gemini API] ${modelName} unavailable (${err?.message || err}). Trying next model...`);
          break; // Move to next candidate model
        }
      }
    }
  }

  throw lastError || new Error("All AI models are currently unavailable. Please try again in a few moments.");
}

export async function generateChatText(prompt) {
  const result = await callWithFallback(CHAT_GENERATION_CONFIG, prompt);

  const text = result?.response?.text?.();
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("AI chat response is empty.");
  }

  return text.trim();
}

function normalizeCodeResult(parsed) {
  if (!parsed || typeof parsed !== "object") {
    console.error("[AiModel] normalizeCodeResult: parsed is not an object:", typeof parsed);
    return {
      projectTitle: "Generated Project",
      explanation: "",
      files: {},
      generatedFiles: [],
    };
  }

  let projectTitle =
    parsed.projectTitle ||
    parsed.title ||
    parsed.projectName ||
    parsed.name ||
    "Generated Project";
  let explanation =
    parsed.explanation ||
    parsed.description ||
    parsed.summary ||
    "";

  let rawFiles =
    parsed.files ||
    parsed.code ||
    parsed.data?.files ||
    parsed.project?.files;

  // If the AI returned files as an array of {path, code} objects, convert it
  if (Array.isArray(rawFiles)) {
    const converted = {};
    for (const item of rawFiles) {
      if (item && typeof item === "object" && typeof item.path === "string") {
        const key = item.path.startsWith("/") ? item.path : `/${item.path}`;
        const code = typeof item.code === "string" ? item.code : typeof item.content === "string" ? item.content : "";
        converted[key] = { code };
      }
    }
    rawFiles = converted;
  }

  // Fallback: if rawFiles is still null/undefined, try to use parsed itself as files map
  if (!rawFiles || typeof rawFiles !== "object") {
    rawFiles = parsed;
  }

  const normalizedFiles = {};

  if (rawFiles && typeof rawFiles === "object" && !Array.isArray(rawFiles)) {
    for (const [key, value] of Object.entries(rawFiles)) {
      if (
        key === "projectTitle" ||
        key === "explanation" ||
        key === "generatedFiles" ||
        key === "title" ||
        key === "description" ||
        key === "name" ||
        key === "summary" ||
        key === "files" ||
        key === "data" ||
        key === "project"
      ) {
        continue;
      }

      const normalizedKey = key.startsWith("/") ? key : `/${key}`;

      if (typeof value === "string") {
        normalizedFiles[normalizedKey] = { code: value };
      } else if (value && typeof value === "object" && typeof value.code === "string") {
        normalizedFiles[normalizedKey] = { code: value.code };
      }
    }
  }

  // Ensure /App.js is the canonical root component for Sandpack React template
  if (normalizedFiles["/App.jsx"]) {
    normalizedFiles["/App.js"] = normalizedFiles["/App.jsx"];
    delete normalizedFiles["/App.jsx"];
  } else if (normalizedFiles["/src/App.jsx"] || normalizedFiles["/src/App.js"]) {
    const srcApp = normalizedFiles["/src/App.jsx"] || normalizedFiles["/src/App.js"];
    if (!normalizedFiles["/App.js"]) {
      normalizedFiles["/App.js"] = srcApp;
    }
    delete normalizedFiles["/src/App.jsx"];
    delete normalizedFiles["/src/App.js"];
  }

  // Ensure tailwind / styles file exists
  if (!normalizedFiles["/styles.css"] && normalizedFiles["/App.css"]) {
    normalizedFiles["/styles.css"] = normalizedFiles["/App.css"];
  }

  const generatedFiles = Object.keys(normalizedFiles);
  console.log(`[AiModel] normalizeCodeResult: ${generatedFiles.length} files normalized. Title: "${projectTitle}"`);

  return {
    projectTitle: String(projectTitle),
    explanation: String(explanation),
    files: normalizedFiles,
    generatedFiles,
  };
}

export async function generateCodeJson(prompt) {
  const result = await callWithFallback(CODE_GENERATION_CONFIG, prompt);

  const rawText = result?.response?.text?.();
  if (typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("AI code response is empty.");
  }

  console.log("[AiModel] Raw Gemini response (first 500 chars):", rawText.slice(0, 500));

  const parsed = parseJsonSafely(rawText);
  console.log("[AiModel] Parsed top-level keys:", parsed && typeof parsed === "object" ? Object.keys(parsed) : typeof parsed);
  return normalizeCodeResult(parsed);
}

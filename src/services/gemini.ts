import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, Recipe, UserPreferences } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeFridgeImage = async (base64Image: string): Promise<Partial<Ingredient>[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      {
        text: "Analyze this fridge photo. List all visible ingredients. For each, estimate the quantity and how many days it likely has left before expiring (based on typical shelf life). Return a JSON array of objects with 'name', 'quantity', and 'estimatedDaysLeft'.",
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.STRING },
            estimatedDaysLeft: { type: Type.NUMBER },
          },
          required: ["name", "quantity", "estimatedDaysLeft"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const generateRecipes = async (
  ingredients: Ingredient[],
  preferences: UserPreferences
): Promise<Recipe[]> => {
  const ingredientList = ingredients
    .map((i) => `${i.name} (${i.quantity}, ${i.expiryRisk} status)`)
    .join(", ");

  const prompt = `Based on these ingredients: ${ingredientList}. 
  User preferences: ${preferences.dietaryRestrictions.join(", ")}, Goal: ${preferences.fitnessGoal}.
  Prioritize using ingredients marked as 'soon' or 'expired' to reduce waste.
  Generate 3 healthy, balanced recipes. 
  Include health indicators (0-100) for protein, veggies, and carbs.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            prepTime: { type: Type.STRING },
            healthIndicators: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.NUMBER },
                veggies: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
              },
            },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["id", "name", "description", "ingredients", "instructions", "prepTime", "healthIndicators"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse recipes", e);
    return [];
  }
};

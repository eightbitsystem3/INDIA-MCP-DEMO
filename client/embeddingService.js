import { pipeline } from "@xenova/transformers";

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return extractor;
}

export async function generateEmbedding(text) {
  const model = await getExtractor();

  const result = await model(text, {
    pooling: "mean",
    normalize: true
  });

  return Array.from(result.data);
}
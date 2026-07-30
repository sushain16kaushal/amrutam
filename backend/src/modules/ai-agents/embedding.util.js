

import { pipeline,env} from '@xenova/transformers';
env.cacheDir = '/tmp/.transformers-cache';
env.allowLocalModels = false;
let embedderPromise = null;

const getEmbedder = () => {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPromise;
};

// text -> plain JS array of 384 floats
export const embedText = async (text) => {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

// pgvector column mein insert karne ke liye literal string chahiye: '[0.1,0.2,...]'
// node-postgres arrays ko auto-cast nahi karta, isliye yeh helper zaroori hai —
// query mein $n::vector ke saath use hoga
export const toVectorLiteral = (embeddingArray) => `[${embeddingArray.join(',')}]`;

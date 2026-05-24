const { products } = require('./src/data/mock');
const { semanticSearch } = require('./src/services/semantic-search');

console.log("Mock products count:", products.length);
const results = semanticSearch("chicken");
console.log("Semantic search results for 'chicken':", JSON.stringify(results, null, 2));

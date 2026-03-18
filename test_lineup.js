fetch("http://localhost:3000/api/kuji-lineup?year=2024&month=3").then(r => r.json()).then(console.log).catch(console.error);

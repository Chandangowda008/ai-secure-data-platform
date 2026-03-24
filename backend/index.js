import app from "./app.js";
const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`AI Secure Data Intelligence Platform backend listening on port ${PORT}`);
});

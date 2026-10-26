import { app } from './app';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Invoice_Generator API server running on http://localhost:${PORT}`);
});

import { app } from "./app";
import config from "./config";
import connectDB from "./database";

connectDB()
  .then(() => {
    app.listen(config.app.port || 8080, () => {
      console.log(`⚙️ Server is running at port : ${config.app.port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

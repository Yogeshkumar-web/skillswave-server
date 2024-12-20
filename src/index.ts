import { app } from "./app";
import envVariables from "./config/env-variables";
import connectDB from "./database";

connectDB()
  .then(() => {
    app.listen(envVariables.PORT || 8080, () => {   
      console.log(`⚙️ Server is running at port : ${envVariables.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

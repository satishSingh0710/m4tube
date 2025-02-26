import express from "express";
import cors from "cors";
import logger from "./logger.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
const morganFormat = ":method :url :status :response-time ms";

const app = express();

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

// common middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "146kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "146kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());

// importing routes
import healthcheckRouter from "./routes/healtcheck.routes.js";
import userRouter from "./routes/user.routes.js";
//routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);

export { app };

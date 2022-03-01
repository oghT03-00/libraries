const fs = require("fs");
const path = require("path");

const JwtToken = require("../../../../../../CLOUDCODE/Github/oListRepos/NodeJS/oModules/googleAuth/jwt.js").JwtToken;
const oAxios = require("../../../../../../CLOUDCODE/Github/oListRepos/NodeJS/oModules/oAxios.js");
const oUtils = require("../../../../../../CLOUDCODE/Github/oListRepos/NodeJS/oModules/oUtils.js");

const InitializeExecuter = () => {
   let options = {};
   let optionsPath = path.join(path.dirname(__filename), "option.executer.json");
   if (fs.existsSync(optionsPath)) {
      options = JSON.parse(fs.readFileSync(optionsPath, { encoding: "utf-8" }));
   }
   return options;
};
const InitializeSecrets = (options) => {
   const isShowLog = options?.IsShowLogInitializeSecrets || false;
   if (isShowLog) {
      console.log("=====InitializeSecrets=====");
   }
   let secrets = {};
   if ("GITHUB_secrets" in process.env) {
      const GITHUB_secrets = JSON.parse(process.env.GITHUB_secrets);
      for (const [key, value] of Object.entries(GITHUB_secrets)) {
         if (key !== "github_token") secrets[key] = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
      }
   } else {
      let secretsPath = path.join(path.dirname(__filename), ".githubsecrets");
      if (fs.existsSync(secretsPath)) {
         let files = fs.readdirSync(secretsPath);
         let extension = ".githubsecrets.json";
         for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.endsWith(extension)) {
               let contentFile = fs.readFileSync(path.join(secretsPath, file), { encoding: "utf8" });
               secrets[file.replace(extension, "")] = JSON.parse(contentFile);
            }
         }
      }
   }
   if (isShowLog) {
      console.log(JSON.stringify(secrets, null, "\t"));
      console.log("=====END:InitializeSecrets=");
   }
   return secrets;
};
const options = InitializeExecuter();
const secrets = InitializeSecrets(options);
(async () => {
   let scopes = "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email";
   for (let i = 0; i < secrets.CONFIG.Rtdbs.length; i++) {
      let rtdb = secrets.CONFIG.Rtdbs[i];
      let token = await JwtToken(rtdb.client_email, scopes, rtdb.private_key);
      console.log({ client_email: rtdb.client_email, token });
   }
})();

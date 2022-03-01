const fs = require("fs");
const path = require("path");

const JwtToken = require("E:/CLOUDCODE/Github/oListRepos/NodeJS/oModules/googleAuth/jwt.js").JwtToken;
const oAxios = require("E:/CLOUDCODE/Github/oListRepos/NodeJS/oModules/oAxios.js");
const oUtils = require("E:/CLOUDCODE/Github/oListRepos/NodeJS/oModules/oUtils.js");

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
   if ("context_github" in process.env) {
      secrets.context_github = JSON.parse(process.env.GITHUB_secrets);
   }
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
   let deploy_librariesPath = path.join(path.dirname(__filename), "..", options.Library.SourceDirectoryName);
   let files = oUtils.GetAllFiles(deploy_librariesPath, []);
   files = files.filter((e) => e.toString().endsWith(".libraryfile.json"));
   console.log({ deploy_librariesPath, files });
   let scopes = "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email";
   let defaultFields = ["FileHashMD5", "FileHashSHA1", "AssemblyFullNameMD5", "AssemblyFullNameSHA1"];
   for (let i = 0; i < files.length; i++) {
      let libFile = oUtils.JSONLoadForce(files[i]);
      if ("context_github" in secrets) {
         libFile.public_urls = [`https://raw.githubusercontent.com/oghT03-00/libraries/main/Deploy_Libraries/License.dll`];
      }
      for (let j = 0; j < secrets.CONFIG.Rtdbs.length; j++) {
         let rtdb = secrets.CONFIG.Rtdbs[j];
         if (!("access_token" in rtdb)) {
            rtdb.access_token = (await JwtToken(rtdb.client_email, scopes, rtdb.private_key)).access_token;
         }
         let fields = rtdb.library_fields || defaultFields;
         let allPromises = fields.map((field) => {
            while (rtdb.rtdb_url.endsWith("/")) rtdb.rtdb_url = rtdb.rtdb_url.slice(0, -1);
            let url = `${rtdb.rtdb_url}/${libFile[field]}.json`;
            return oAxios
               .Patch({
                  url: url,
                  data: libFile,
                  access_token: rtdb.access_token,
               })
               .then(() => Promise.resolve(`OK:${url}`))
               .catch((error) => Promise.resolve(`ERROR:${url}:${error + ""}`));
         });
         Promise.all(allPromises).then((values) => {
            console.log(values);
         });
      }
   }
})();

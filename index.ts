import {Application} from "./Application";
import * as path from "path";

(function () {
  let ENVIRONMENT = null;
  for(let i = 0; i < process.argv.length; i++){
    if(process.argv[i] === "--ENVIRONMENT"){
      ENVIRONMENT = process.argv[i+1];
      break;
    }
  }
  let config = null;
  if(!ENVIRONMENT){
    return console.error('You need pass me an ENVIRONMENT variable');
  }
  else if(ENVIRONMENT === 'prod'){
    config = path.resolve("config.json");
  } else if(ENVIRONMENT === 'dev'){
    config = path.resolve('devConfig.json');
  } else {
    return console.error('The ENVIRONMENT variable is unknown!');
  }
  new Application(config);
})();
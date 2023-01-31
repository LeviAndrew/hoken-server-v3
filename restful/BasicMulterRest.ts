import {BasicRest} from "./BasicRest";
import * as multer from "multer";
import * as path from "path";

export abstract class BasicMulterRest extends BasicRest {

  protected constructor (router, handler) {
    super(router, handler);
  }

  protected configureSingleMulter (param: multerParam) {
    return multer({
      fileFilter (req: any, file, callback) {
        let acceptedFile = false;
        for (let i = 0; i < param.acceptedTypes.length; i++) {
          if(file.mimetype === param.acceptedTypes[i]) {
            acceptedFile = true;
            break;
          }
        }

        if(!acceptedFile) { // @ts-ignore
          callback(new Error("invalidDocumentType"), acceptedFile);
        }
        else callback(null, true);
      },
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, param.dest);
        },
        filename (req: any, file, callback) {
          callback(null, `${param.documentName}${path.extname(file.originalname)}`);
        },
      }),
    }).single(param.fieldName);
  }

}

interface multerParam {
  dest: string,
  documentName: string,
  fieldName: string,
  acceptedTypes: string[]
}
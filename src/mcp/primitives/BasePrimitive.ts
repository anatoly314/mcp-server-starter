import pino from "pino";
import {createLogger} from "../../logger";

export abstract class BasePrimitive {
    private static _parentLogger: pino.Logger
    protected logger: pino.Logger;

    constructor() {
        if (!BasePrimitive._parentLogger) {
            BasePrimitive._parentLogger = createLogger("Primitive");
        }

        const className = this.constructor.name;
        this.logger = BasePrimitive._parentLogger.child({ className: className });
    }
}

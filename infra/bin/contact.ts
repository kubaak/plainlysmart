import { App } from "aws-cdk-lib";
import { ContactStack } from "../lib/contact-stack";

const app = new App();
new ContactStack(app, "PlainlySmartContact");

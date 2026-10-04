import * as path from "node:path";
import { CfnOutput, CfnParameter, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class ContactStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const parameter = (name: string, defaultValue?: string) =>
      new CfnParameter(this, name, {
        type: "String",
        ...(defaultValue === undefined ? {} : { default: defaultValue }),
        minLength: defaultValue === "" ? 0 : 1,
      }).valueAsString;
    const secretArn = parameter("ContactSecretArn");
    const secret = secretsmanager.Secret.fromSecretCompleteArn(this, "ContactSecret", secretArn);
    const functionLogs = new logs.LogGroup(this, "FunctionLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const role = new iam.Role(this, "ContactRole", { assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com") });
    functionLogs.grantWrite(role);
    const fn = new NodejsFunction(this, "ContactFunction", {
      entry: path.join(__dirname, "../lambda/handler.ts"),
      handler: "handler",
      depsLockFilePath: path.join(__dirname, "../package-lock.json"),
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: Duration.seconds(28),
      logGroup: functionLogs,
      role,
      bundling: { target: "node24", minify: true, externalModules: [] },
      environment: {
        CONTACT_SECRET_ARN: secret.secretArn,
        BREVO_LEADS_LIST_ID: parameter("BrevoLeadsListId"),
        BREVO_NEWSLETTER_LIST_ID: parameter("BrevoNewsletterListId"),
        CONTACT_NOTIFICATION_EMAIL: parameter("ContactNotificationEmail", "hello@plainlysmart.com"),
        CONTACT_REPLY_TO_EMAIL: parameter("ContactReplyToEmail", "hello@plainlysmart.com"),
        BREVO_SENDER_EMAIL: parameter("BrevoSenderEmail", "hello@mail.plainlysmart.com"),
        BREVO_SENDER_NAME: parameter("BrevoSenderName", "PlainlySmart"),
        BOOKING_URL: parameter("BookingUrl", ""),
        TURNSTILE_HOSTNAMES: parameter(
          "TurnstileHostnames",
          "plainlysmart.com,www.plainlysmart.com,localhost,127.0.0.1",
        ),
      },
    });
    secret.grantRead(fn);
    const api = new apigw.HttpApi(this, "ContactApi", {
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: [
          "https://plainlysmart.com",
          "https://www.plainlysmart.com",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:4173",
        ],
        allowMethods: [apigw.CorsHttpMethod.POST],
        allowHeaders: ["content-type"],
        maxAge: Duration.hours(1),
      },
    });
    api.addRoutes({
      path: "/contact",
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration("ContactIntegration", fn),
    });
    const accessLogs = new logs.LogGroup(this, "AccessLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const stage = new apigw.HttpStage(this, "DefaultStage", {
      httpApi: api,
      stageName: "$default",
      autoDeploy: true,
      throttle: { rateLimit: 5, burstLimit: 10 },
    });
    const cfnStage = stage.node.defaultChild as apigw.CfnStage;
    cfnStage.accessLogSettings = {
      destinationArn: accessLogs.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        status: "$context.status",
        routeKey: "$context.routeKey",
        integrationStatus: "$context.integration.status",
        latency: "$context.responseLatency",
      }),
    };
    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "ContactUrl", { value: `${api.apiEndpoint}/contact` });
    const domainName = this.node.tryGetContext("domainName") as string | undefined;
    if (domainName) {
      const certificateArn = this.node.tryGetContext("certificateArn") as string | undefined;
      const certificate = certificateArn
        ? acm.Certificate.fromCertificateArn(this, "Certificate", certificateArn)
        : new acm.Certificate(this, "Certificate", { domainName, validation: acm.CertificateValidation.fromDns() });
      const domain = new apigw.DomainName(this, "ApiDomain", { domainName, certificate });
      new apigw.ApiMapping(this, "ApiMapping", { api, domainName: domain, stage });
      new CfnOutput(this, "CustomApiUrl", { value: `https://${domainName}` });
      new CfnOutput(this, "CloudflareCnameTarget", { value: domain.regionalDomainName });
    }
  }
}

import * as path from "node:path";
import { CfnOutput, Duration, RemovalPolicy, Stack, Tags, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import { loadStageConfig } from "./stage-config";

export class ContactStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    const { stage: environment, config } = loadStageConfig(scope.node.tryGetContext("stage") ?? "prod");
    const prefix = `ps-${environment}-contact`;
    super(scope, id, { ...props, stackName: prefix });
    for (const [key, value] of Object.entries({ Project: "Plainlysmart", ProjectCode: "ps", Environment: environment, ManagedBy: "CDK" })) {
      Tags.of(this).add(key, value);
    }
    const secret = secretsmanager.Secret.fromSecretNameV2(this, "ContactSecret", config.contactSecretName);
    const functionLogs = new logs.LogGroup(this, "FunctionLogs", {
      logGroupName: `/aws/lambda/${prefix}-handler`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const role = new iam.Role(this, "ContactRole", { assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com") });
    functionLogs.grantWrite(role);
    const fn = new NodejsFunction(this, "ContactFunction", {
      functionName: `${prefix}-handler`,
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
        CONTACT_SECRET_NAME: config.contactSecretName,
        BREVO_LEADS_LIST_ID: String(config.brevoLeadsListId),
        BREVO_NEWSLETTER_LIST_ID: String(config.brevoNewsletterListId),
        CONTACT_NOTIFICATION_EMAIL: config.contactNotificationEmail,
        CONTACT_REPLY_TO_EMAIL: config.contactReplyToEmail,
        BREVO_SENDER_EMAIL: config.brevoSenderEmail,
        BREVO_SENDER_NAME: config.brevoSenderName,
        BOOKING_URL: config.bookingUrl,
        TURNSTILE_HOSTNAMES: config.turnstileHostnames.join(","),
      },
    });
    secret.grantRead(fn);
    const api = new apigw.HttpApi(this, "ContactApi", {
      apiName: `${prefix}-api`,
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
      logGroupName: `${prefix}-access-logs`,
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
    // Keep production domain ownership stable across deployments; dev stays opt-in.
    const domainName = (this.node.tryGetContext("domainName") ??
      (environment === "prod" ? "api.plainlysmart.com" : undefined)) as string | undefined;
    if (domainName) {
      const certificateArn = this.node.tryGetContext("certificateArn") as string | undefined;
      const certificate = certificateArn
        ? acm.Certificate.fromCertificateArn(this, "Certificate", certificateArn)
        : new acm.Certificate(this, "Certificate", { domainName, validation: acm.CertificateValidation.fromDns() });
      const domain = new apigw.DomainName(this, "ApiDomain", {
        domainName, certificate, securityPolicy: apigw.SecurityPolicy.TLS_1_2,
      });
      new apigw.ApiMapping(this, "ApiMapping", { api, domainName: domain, stage });
      new CfnOutput(this, "CustomApiUrl", { value: `https://${domainName}` });
      new CfnOutput(this, "CustomContactUrl", { value: `https://${domainName}/contact` });
      new CfnOutput(this, "CloudflareCnameTarget", { value: domain.regionalDomainName });
    }
  }
}

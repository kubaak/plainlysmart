import { test } from "node:test";
import { App } from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { ContactStack } from "../lib/contact-stack";
import assert from "node:assert/strict";

test("resource names and stack tags follow the deployment stage", () => {
  for (const environment of ["prod", "dev"]) {
    const stack = new ContactStack(new App({ context: { stage: environment } }), "PlainlySmartContact");
    assert.equal(stack.stackName, `ps-${environment}-contact`);
    const template = Template.fromStack(stack);
    const tags = Object.entries({ Project: "Plainlysmart", ProjectCode: "ps", Environment: environment, ManagedBy: "CDK" })
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([Key, Value]) => ({ Key, Value }));
    template.hasResourceProperties("AWS::Lambda::Function", { FunctionName: `ps-${environment}-contact-handler`, Tags: Match.arrayWith(tags) });
    template.hasResourceProperties("AWS::ApiGatewayV2::Api", { Name: `ps-${environment}-contact-api` });
    template.hasResourceProperties("AWS::Logs::LogGroup", { LogGroupName: `/aws/lambda/ps-${environment}-contact-handler` });
    template.hasResourceProperties("AWS::Logs::LogGroup", { LogGroupName: `ps-${environment}-contact-access-logs` });
    template.resourceCountIs("AWS::SecretsManager::Secret", 0);
    for (const role of Object.values(template.findResources("AWS::IAM::Role"))) {
      assert.equal(role.Properties.RoleName, undefined);
    }
  }
  assert.equal(new ContactStack(new App(), "DefaultTest").stackName, "ps-prod-contact");
});

test("unsafe or excessively long stages are rejected", () => {
  for (const stage of ["", "Prod", "a/b", "prod\n", "-dev", "dev-", "dev--eu", "a".repeat(33), 123]) {
    assert.throws(() => new ContactStack(new App({ context: { stage } }), "Invalid"), /stage must/);
  }
});

test("small HTTP proxy API with scoped secrets access and logging", () => {
  const template = Template.fromStack(new ContactStack(new App(), "TestContact"));
  assert.deepEqual(Object.keys(template.toJSON().Parameters ?? {}).filter(key => key !== "BootstrapVersion"), []);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: { Variables: {
      CONTACT_SECRET_NAME: "ps-prod-contact",
      BREVO_LEADS_LIST_ID: "3",
      BREVO_NEWSLETTER_LIST_ID: "4",
      CONTACT_NOTIFICATION_EMAIL: "info@plainlysmart.com",
      CONTACT_REPLY_TO_EMAIL: "info@plainlysmart.com",
      BREVO_SENDER_EMAIL: "info@plainlysmart.com",
      BREVO_SENDER_NAME: "PlainlySmart",
      BOOKING_URL: "",
      TURNSTILE_HOSTNAMES: "plainlysmart.com,www.plainlysmart.com",
    } },
  });
  template.resourceCountIs("AWS::Lambda::Function", 1);
  template.resourceCountIs("AWS::Logs::LogGroup", 2);
  template.resourceCountIs("AWS::EC2::VPC", 0);
  template.hasResourceProperties("AWS::Lambda::Function", { Runtime: "nodejs24.x" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
    ProtocolType: "HTTP", CorsConfiguration: { AllowMethods: ["POST"], AllowHeaders: ["content-type"], AllowOrigins: Match.arrayWith(["https://plainlysmart.com", "http://localhost:3000"]) },
  });
  template.hasResourceProperties("AWS::ApiGatewayV2::Route", { RouteKey: "POST /contact" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Integration", { IntegrationType: "AWS_PROXY", PayloadFormatVersion: "2.0" });
  template.hasResourceProperties("AWS::ApiGatewayV2::Stage", { AccessLogSettings: Match.objectLike({ DestinationArn: Match.anyValue() }) });
  template.hasResourceProperties("AWS::IAM::Policy", { PolicyDocument: { Statement: Match.arrayWith([Match.objectLike({ Action: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"], Resource: { "Fn::Join": ["", Match.arrayWith([":secret:ps-prod-contact-??????"])] } })]) } });
});
test("optional custom domain and DNS validated ACM certificate", () => {
  const app = new App({ context: { domainName: "api.plainlysmart.com" } });
  const template = Template.fromStack(new ContactStack(app, "DomainTest"));
  template.hasResourceProperties("AWS::CertificateManager::Certificate", { DomainName: "api.plainlysmart.com", ValidationMethod: "DNS" });
  template.resourceCountIs("AWS::ApiGatewayV2::ApiMapping", 1);
});

test("production domain only adds resources and preserves the existing API, Lambda and IAM", () => {
  const synth = (context: Record<string, string>) => Template.fromStack(new ContactStack(
    new App({ context: { stage: "prod", ...context } }), "PlainlySmartContact",
    { env: { account: "111111111111", region: "eu-central-1" } },
  ));
  const baseline = synth({ domainName: "" }).toJSON();
  const template = synth({});
  const result = template.toJSON();
  for (const [logicalId, resource] of Object.entries(baseline.Resources)) {
    assert.deepEqual(result.Resources[logicalId], resource, `existing resource ${logicalId} changed`);
  }
  assert.deepEqual(Object.keys(result.Resources).filter(id => !baseline.Resources[id]).sort(),
    Object.keys(template.findResources("AWS::CertificateManager::Certificate"))
      .concat(Object.keys(template.findResources("AWS::ApiGatewayV2::DomainName")),
        Object.keys(template.findResources("AWS::ApiGatewayV2::ApiMapping"))).sort());
  template.resourceCountIs("AWS::CertificateManager::Certificate", 1);
  template.hasResourceProperties("AWS::CertificateManager::Certificate", {
    DomainName: "api.plainlysmart.com", ValidationMethod: "DNS",
  });
  const certificateId = Object.keys(template.findResources("AWS::CertificateManager::Certificate"))[0];
  const apiId = Object.keys(template.findResources("AWS::ApiGatewayV2::Api"))[0];
  const stageId = Object.keys(template.findResources("AWS::ApiGatewayV2::Stage"))[0];
  const domainId = Object.keys(template.findResources("AWS::ApiGatewayV2::DomainName"))[0];
  template.hasResourceProperties("AWS::ApiGatewayV2::DomainName", {
    DomainName: "api.plainlysmart.com",
    DomainNameConfigurations: [{ CertificateArn: { Ref: certificateId }, EndpointType: "REGIONAL", SecurityPolicy: "TLS_1_2" }],
  });
  template.hasResourceProperties("AWS::ApiGatewayV2::ApiMapping", {
    ApiId: { Ref: apiId }, DomainName: { Ref: domainId }, Stage: "$default",
  });
  assert.ok(Object.values(template.findResources("AWS::ApiGatewayV2::ApiMapping"))[0].DependsOn.includes(stageId));
  assert.equal(Object.values(template.findResources("AWS::ApiGatewayV2::ApiMapping"))[0].Properties.ApiMappingKey, undefined);
  template.hasOutput("CustomApiUrl", { Value: "https://api.plainlysmart.com" });
  template.hasOutput("CustomContactUrl", { Value: "https://api.plainlysmart.com/contact" });
  template.hasOutput("CloudflareCnameTarget", { Value: { "Fn::GetAtt": [domainId, "RegionalDomainName"] } });
  assert.deepEqual(result, synth({}).toJSON(), "repeated synthesis must be stable");
});

test("development does not claim the production domain and imported certificates stay external", () => {
  const dev = Template.fromStack(new ContactStack(new App({ context: { stage: "dev" } }), "PlainlySmartContact"));
  dev.resourceCountIs("AWS::CertificateManager::Certificate", 0);
  dev.resourceCountIs("AWS::ApiGatewayV2::DomainName", 0);
  const imported = Template.fromStack(new ContactStack(new App({ context: {
    certificateArn: "arn:aws:acm:eu-central-1:111111111111:certificate/12345678-1234-1234-1234-123456789012",
  } }), "PlainlySmartContact"));
  imported.resourceCountIs("AWS::CertificateManager::Certificate", 0);
  imported.resourceCountIs("AWS::ApiGatewayV2::ApiMapping", 1);
});

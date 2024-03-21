import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");

export class CdkGqlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "tutorialAPI", {
      name: "tutorialAPI",
      schema: appsync.SchemaFile.fromAsset("schema/schema.graphql"),
    });

    const userTable = new Table(this, "user", {
      partitionKey: { name: "id", type: AttributeType.STRING },
    });

    const getUsersLambda = new NodejsFunction(this, "getUsersLambdaHandler", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, `/../lambdas/getUsers/index.ts`),
      handler: "handler",
      environment: {
        USER_TABLE: userTable.tableName,
      },
    });

    const usersDataSource = api.addLambdaDataSource(
      "getUsersLambda",
      getUsersLambda
    );

    usersDataSource.createResolver(`getUsersLambdaResolver`, {
      typeName: "Query",
      fieldName: "getUsers",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "Invoke",
        "payload": {
          "arguments": $util.toJson($context.arguments)
        }
      }`),
    });

    const updateUserLambda = new NodejsFunction(
      this,
      "updateUserLambdaHandler",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, `/../lambdas/updateUser/index.ts`),
        handler: "handler",
        environment: {
          USER_TABLE: userTable.tableName,
        },
      }
    );
    const updateUsersDataSource = api.addLambdaDataSource(
      "updateUserLambda",
      updateUserLambda
    );

    updateUsersDataSource.createResolver(`createUserLambdaResolver`, {
      typeName: "Mutation",
      fieldName: "createUser",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "Invoke",
        "payload": {
          "arguments": $util.toJson($context.arguments),
          "operation": "create"
        }
      }`),
    });

    updateUsersDataSource.createResolver(`updateUserLambdaResolver`, {
      typeName: "Mutation",
      fieldName: "updateUser",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "Invoke",
        "payload": {
          "arguments": $util.toJson($context.arguments),
          "operation": "update"
        }
      }`),
    });

    updateUsersDataSource.createResolver(`deleteUserLambdaResolver`, {
      typeName: "Mutation",
      fieldName: "deleteUser",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`{
        "version": "2017-02-28",
        "operation": "Invoke",
        "payload": {
          "arguments": $util.toJson($context.arguments),
          "operation": "delete"
        }
      }`),
    });

    userTable.grantReadData(getUsersLambda);
    userTable.grantReadWriteData(updateUserLambda);

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || "",
    });
  }
}

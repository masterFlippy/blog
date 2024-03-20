import { Handler } from "aws-cdk-lib/aws-lambda";

import { DynamoDB } from "aws-sdk";

const dynamo = new DynamoDB.DocumentClient();
const userTable: string = process.env.USER_TABLE!;
interface IUsersEvent {
  identity: {
    cognitoIdentityId: string;
    cognitoIdentityAuthProvider: string;
  };
  arguments: {
    id?: string;
  };
}

export const handler: Handler = async (event: IUsersEvent) => {
  try {
    const id = event.arguments.id;
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: userTable,
      ...(id
        ? {
            FilterExpression: "id = :value",
            ExpressionAttributeValues: {
              ":value": id,
            },
          }
        : {}),
    };
    const users = await dynamo.scan(params).promise();

    return users.Items;
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};

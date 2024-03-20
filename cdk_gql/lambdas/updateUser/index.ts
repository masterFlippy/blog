import { Handler } from "aws-cdk-lib/aws-lambda";

import { DynamoDB } from "aws-sdk";
import {
  TArgs,
  EOperation,
  ICreateUserArgs,
  IUpdateUserArgs,
  IDeleteUserArgs,
  IUser,
} from "../../types";
import { getUser } from "../../queries";

const dynamo = new DynamoDB.DocumentClient();
const userTable: string = process.env.USER_TABLE!;
export interface IUpdateUsersEvent {
  identity: {
    cognitoIdentityId: string;
    cognitoIdentityAuthProvider: string;
  };
  arguments: TArgs;
  operation: EOperation;
}

function isCreateArgs(
  _arguments: TArgs,
  operation: EOperation
): _arguments is ICreateUserArgs {
  return operation === EOperation.create;
}

function isUpdateArgs(
  _arguments: TArgs,
  operation: EOperation
): _arguments is IUpdateUserArgs {
  return operation === EOperation.update;
}

function isDeleteArgs(
  _arguments: TArgs,
  operation: EOperation
): _arguments is IDeleteUserArgs {
  return operation === EOperation.delete;
}

export const handler: Handler = async (event: IUpdateUsersEvent) => {
  try {
    let user: IUser;
    if (isCreateArgs(event.arguments, event.operation)) {
      user = await createUser(event.arguments);
    } else if (isUpdateArgs(event.arguments, event.operation)) {
      user = await updateUser(event.arguments);
    } else if (isDeleteArgs(event.arguments, event.operation)) {
      user = await deleteUser(event.arguments);
    } else {
      throw new Error("Invalid operation");
    }
    return user;
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};

async function createUser(args: ICreateUserArgs) {
  let user = await getUser(args.input.id, dynamo);

  if (user.Item) {
    throw new Error("User already exists");
  }
  console.log(
    {
      id: args.input.id,
      name: args.input.name,
      email: args.input.email,
    },
    userTable
  );

  const item: IUser = {
    id: args.input.id,
    name: args.input.name,
    email: args.input.email,
  };
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: userTable,
    Item: item,
  };
  await dynamo.put(params).promise();

  user = await getUser(args.input.id, dynamo);

  if (!user) {
    throw new Error(`Internal Error: User missing for id ${args.input.id}`);
  }

  return user.Item as IUser;
}

async function updateUser(args: IUpdateUserArgs) {
  let user = await getUser(args.input.id, dynamo);

  if (!user.Item) {
    throw new Error(`User with id ${args.input.id} does not exist`);
  }

  const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: userTable,
    Key: {
      id: args.input.id,
    },
    UpdateExpression: "set #email = :email, #name = :name",
    ExpressionAttributeNames: {
      "#email": "email",
      "#name": "name",
    },
    ExpressionAttributeValues: {
      ":email": args.input.email ?? user.Item.email,
      ":name": args.input.name ?? user.Item.name,
    },
  };
  await dynamo.update(params).promise();

  user = await getUser(args.input.id, dynamo);

  if (!user) {
    throw new Error(`Internal Error: User missing for id ${args.input.id}`);
  }

  return user.Item as IUser;
}

async function deleteUser(args: IDeleteUserArgs) {
  let user = await getUser(args.id, dynamo);

  if (!user.Item) {
    throw new Error(`User with id ${args.id} does not exist`);
  }

  const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: userTable,
    Key: {
      id: args.id,
    },
  };
  await dynamo.delete(params).promise();
  return user.Item as IUser;
}

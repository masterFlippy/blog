const userTable: string = process.env.USER_TABLE!;

export async function getUser(id: string, dynamo: AWS.DynamoDB.DocumentClient) {
  return await dynamo
    .get({
      TableName: userTable,
      Key: {
        id,
      },
    })
    .promise();
}

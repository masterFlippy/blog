export const enum EOperation {
  create = "create",
  update = "update",
  delete = "delete",
}

// User
export interface IUser {
  id: string;
  name: string;
  email: string;
}

export interface ICreateUserArgs {
  input: {
    id: string;
    name: string;
    email: string;
  };
}

export interface IUpdateUserArgs {
  input: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface IDeleteUserArgs {
  id: string;
}

export type TArgs = ICreateUserArgs | IUpdateUserArgs | IDeleteUserArgs;
